const express = require("./node_modules/express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

const dbpath = path.join(__dirname, "/userData.db");
let db = null;

async function initializer() {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server started on port 3000");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
}

initializer();

//first api
app.post("/register", async (req, res) => {
  const { username, name, password, gender, location } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const findUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const selectedUser = await db.get(findUserQuery);
  if (password.length < 5) {
    res.status(400);
    res.send("Password is too short");
  } else if (selectedUser === undefined) {
    const registerQuery = `INSERT INTO user (username,name , password, gender, location)
        VALUES( '${username}',	'${name}', '${hashedPassword}', '${gender}', '${location}');`;
    await db.run(registerQuery);
    res.status(200);
    res.send("User created successfully");
  } else {
    res.status(400);
    res.send("User already exists");
  }
});

//second api
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const getUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(getUserQuery);
  if (dbUser === undefined) {
    res.status(400);
    res.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched) {
      res.status(200);
      res.send("Login success!");
    } else {
      res.status(400);
      res.send("Invalid password");
    }
  }
});

//third api
app.put("/change-password", async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;
  if (newPassword.length < 5) {
    res.status(400);
    res.send("Password is too short");
  } else {
    const bringUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
    const dbUser = await db.get(bringUserQuery);
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      dbUser.password
    );
    if (isPasswordMatched) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const changePasswordQuery = `UPDATE user
                        SET password = '${hashedPassword}'
                        WHERE
                            username = '${username}';`;
      await db.run(changePasswordQuery);
      res.status(200);
      res.send("Password updated");
    } else {
      res.status(400);
      res.send("Invalid current password");
    }
  }
});

module.exports = app;

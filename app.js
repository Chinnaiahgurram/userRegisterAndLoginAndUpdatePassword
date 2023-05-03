const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "userData.db");
const app = express();
const bcrypt = require("bcrypt");
app.use(express.json());

let db = null;
const initializerDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("This server running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`Db server ar${error.message}`);
    process.exit(1);
  }
};
initializerDbAndServer();

app.post("/register/", async (request, response) => {
  let { username, name, password, gender, location } = request.body;
  let hashedPassword = await bcrypt.hash(request.body.password, 10);
  let checkTheUsername = `
            SELECT *
            FROM user
            WHERE username = '${username}';`;
  let userData = await db.get(checkTheUsername);

  if (userData === undefined) {
    let postNewUserQuery = `
            INSERT INTO
            user (username,name,password,gender,location)
            VALUES (
                '${username}',
                '${name}',
                '${hashedPassword}',
                '${gender}',
                '${location}'
            );`;
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      let newUserDetails = await db.run(postNewUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  let { username, password } = request.body;
  let selectUserQuery = `
  SELECT * FROM user WHERE username='${username}' `;
  let dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    let isPasswordMatch = await bcrypt.compare(password, dbUser.password);

    if (isPasswordMatch === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const checkForUserQuery = `
SELECT * FROM user WHERE 
USERNAME ='${username}'`;
  let dbUser = await db.get(checkForUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("User not Registered");
  } else {
    let isValidPassword = await bcrypt.compare(oldPassword, dbUser.password);
    if (isValidPassword === true) {
      let lengthOfNewPassword = newPassword.length;
      if (lengthOfNewPassword < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const encryptPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `
            UPDATE user 
            SET 
            password='${encryptPassword}'
            WHERE username='${username}'
            `;
        await db.run(updatePasswordQuery);
        response.status(200);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;

const express = require("express");
const router = express.Router();
const con = require("./database");
const middleware = require("./users");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv");

//-------------AUTHENTIFICATION-------------//

router.post("/register", middleware.validateRegistration, (req, res) => {
  const email = req.body.email;

  con.query(`SELECT * FROM users WHERE email ='${email}'`, (err, result) => {
    if (err) {
      res.status(400).json(err);
    } else if (result.length !== 0) {
      res.status(400).json({ msg: "The user already exists." });
    } else {
      bcrypt.hash(req.body.password, 10, (err, hash) => {
        if (err) {
          res.status(400).json(err);
        } else {
          con.query(
            `INSERT INTO users (email, password, registration_date) VALUES ('${email}', '${hash}', now())`,
            (err, result) => {
              if (err) {
                res.status(400).json(err);
              } else {
                res
                  .status(201)
                  .json({ msg: "User has been registered succsessfully." });
                console.log(result);
              }
            }
          );
        }
      });
    }
  });
});

router.post("/login", (req, res) => {
  const email = req.body.email;
  con.query(`SELECT * FROM users WHERE email = '${email}'`, (err, result) => {
    if (err) {
      res.status(400).json(err);
    } else {
      bcrypt.compare(req.body.password, result[0].password, (bErr, bResult) => {
        if (bErr) {
          return res
            .status(400)
            .json({ msg: "Username or password incorrect" });
        }
        if (bResult) {
          const token = jwt.sign(
            {
              userID: result[0].id,
              username: result[0].username,
            },
            "SECRETKEY",
            { expiresIn: "7d" }
          );
          con.query(
            `UPDATE users SET last_login_date = now() WHERE id = '${result[0].id}'`
          );
          res.status(200).json({ msg: "Logged in", token });
        }
      });
    }
  });
});

router.get("/users", (req, res) => {
  con.query(`SELECT * FROM users`, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.json(result);
    }
  });
});

module.exports = router;

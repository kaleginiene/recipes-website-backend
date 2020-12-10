const express = require("express");
const router = express.Router();
const mysql = require("mysql");
const con = require("./database");
const middleware = require("./users");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

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

router.post("/login", middleware.validateRegistration, (req, res) => {
  const email = req.body.email;
  con.query(
    `SELECT * FROM users WHERE email = ${mysql.escape(email)}`,
    (err, result) => {
      if (err) {
        console.log(err);
        return res
          .status(400)
          .json({ msg: "Internal server error gathering user details" });
      } else if (result.length !== 1) {
        return res.status(400).json({
          msg: "The provided details are incorrect or the user does not exist",
        });
      } else {
        bcrypt.compare(
          req.body.password,
          result[0].password,
          (bErr, bResult) => {
            if (bErr || !bResult) {
              return res.status(400).json({
                msg:
                  "The provided details are incorrect or the user does not exist",
              });
            } else if (bResult) {
              const token = jwt.sign(
                {
                  userId: result[0].id,
                  email: result[0].email,
                },
                process.env.SECRET_KEY,
                {
                  expiresIn: "7d",
                }
              );

              return res.status(200).json({
                msg: "Logged In",
                token,
                userData: {
                  userId: result[0].id,
                  email: result[0].email,
                },
              });
            }
          }
        );
      }
    }
  );
});

//-------------main content-------------//

router.post("/recipes", middleware.isLoggedIn, (req, res) => {
  console.log(req.userData);

  con.query(
    `INSERT INTO recipes (title, image, duration, description, type, user_added, difficulty, ingredients) VALUES ('${req.body.title}', '${req.body.image}', '${req.body.duration}', '${req.body.description}', '${req.body.type}','${req.userData.userID}', '${req.body.difficulty}', '${req.body.ingredients}')`,
    (err, result) => {
      if (err) {
        res.status(400).json(err);
      } else {
        res.status(201).json({ msg: "You successfully added a recipe." });
        console.log(result);
      }
    }
  );
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

router.get("/recipes", (req, res) => {
  con.query(`SELECT * FROM recipes`, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.json(result);
    }
  });
});

module.exports = router;

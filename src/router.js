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
          return res.status(400).json({ msg: "Email or password incorrect" });
        }
        if (bResult) {
          const token = jwt.sign(
            {
              userID: result[0].id,
              email: result[0].email,
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

//-------------main content-------------//

router.post("/recipes", middleware.isLoggedIn, (req, res) => {
  console.log(req.userData);

  con.query(
    `INSERT INTO recipes (title, image, duration, description, type, user_added) VALUES ('${req.body.title}', '${req.body.image}', '${req.body.duration}', '${req.body.description}', '${req.body.type}','${req.userData.userID}')`,
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

router.post("/ingredients", (req, res) => {
  con.query(
    `INSERT INTO ingredients (product, quantity, weight_type, recipe_id) VALUES ('${req.body.product}', '${req.body.quantity}', '${req.body.weightType}', '${req.body.recipeID}')`,
    (err, result) => {
      if (err) {
        res.status(400).json(err);
      } else {
        res
          .status(201)
          .json({ msg: "You successfully added ingredients for your recipe!" });
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

router.get("/ingredients", (req, res) => {
  con.query(`SELECT * FROM ingredients`, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.json(result);
    }
  });
});

module.exports = router;

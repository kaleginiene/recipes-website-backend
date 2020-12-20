const express = require("express");
const router = express.Router();
const mysql = require("mysql");
const database = require("./database");
const middleware = require("./users");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

//-------------AUTHENTIFICATION-------------//

router.post("/register", middleware.validateRegistration, (req, res) => {
  database((db) => {
    const email = req.body.email;

    db.query(`SELECT * FROM users WHERE email ='${email}'`, (err, result) => {
      if (err) {
        res.status(400).json(err);
      } else if (result.length !== 0) {
        res.status(400).json({ msg: "The user already exists." });
      } else {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            res.status(400).json(err);
          } else {
            database((db) => {
              db.query(
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
            });
          }
        });
      }
    });
  });
});

router.post("/login", middleware.validateRegistration, (req, res) => {
  database((db) => {
    const email = req.body.email;
    db.query(
      `SELECT * FROM users WHERE email = ${mysql.escape(email)}`,
      (err, result) => {
        if (err) {
          console.log(err);
          return res
            .status(400)
            .json({ msg: "Internal server error gathering user details" });
        } else if (result.length !== 1) {
          return res.status(400).json({
            msg:
              "The provided details are incorrect or the user does not exist",
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
                database((db) => {
                  db.query(
                    `UPDATE users SET last_login_date = now() WHERE id = '${result[0].id}'`
                  );
                });

                res.status(200).json({
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
});

//-------------main content-------------//

router.post("/recipes", middleware.isLoggedIn, (req, res) => {
  database((db) => {
    console.log(req.userData);

    db.query(
      `INSERT INTO recipes (title, image, duration, description, type, user_added, difficulty, ingredients) VALUES ('${String(
        req.body.title
      )}', '${String(req.body.image)}', '${req.body.duration}', '${String(
        String(req.body.description)
      )}', '${req.body.type}','${req.userData.userId}', '${String(
        req.body.difficulty
      )}', '${String(req.body.ingredients)}')`,
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
});

router.post("/my-recipes", middleware.isLoggedIn, (req, res) => {
  database((db) => {
    console.log(req.userData);

    db.query(
      `INSERT INTO myrecipes (user_id, recipe_id) VALUES ('${req.userData.userId}', '${req.body.recipeID}')`,
      (err, result) => {
        if (err) {
          res.status(400).json(err);
        } else {
          res
            .status(201)
            .json({ msg: "You successfully added recipe to your list." });
          console.log(result);
        }
      }
    );
  });
});

router.get("/users", (req, res) => {
  database((db) => {
    db.query(`SELECT * FROM users`, (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.json(result);
      }
    });
  });
});

router.get("/recipes", (req, res) => {
  database((db) => {
    db.query(`SELECT * FROM recipes`, (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.json(result);
      }
    });
  });
});

router.get("/recipes/:id", (req, res) => {
  database((db) => {
    db.query(
      `SELECT * FROM recipes WHERE id = '${req.params.id}'`,
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
          res.json(result);
        }
      }
    );
  });
});

router.get("/my-recipes", middleware.isLoggedIn, (req, res) => {
  database((db) => {
    db.query(
      `SELECT DISTINCT recipes.id, recipes.title, recipes.image, recipes.duration, recipes.type, recipes.difficulty, recipes.user_added FROM recipes INNER JOIN myrecipes ON myrecipes.recipe_id = recipes.id WHERE myrecipes.user_id = '${req.userData.userId}'`,
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
          res.json(result);
        }
      }
    );
  });
});

router.post("/remove-my-recipe", middleware.isLoggedIn, (req, res) => {
  database((db) => {
    db.query(
      `DELETE from myrecipes WHERE (user_id = '${req.userData.userId}' AND recipe_id = '${req.body.recipeID}')`,
      (err, result) => {
        if (err) {
          res.status(400).json(err);
        } else {
          res.status(201).json({
            msg: "You have successfully removed a recipe from your list.",
          });
          console.log(result);
        }
      }
    );
  });
});

module.exports = router;

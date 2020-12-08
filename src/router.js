const express = require("express");
const router = express.Router();
require("dotenv");

router.get("/", (req, res) => {
  res.send("hello to my nodejs boilerplate");
});

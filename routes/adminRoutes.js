const express = require("express");
const router = express.Router();
const cors = require("cors");
const bcrypt = require("bcrypt");
const mongodb = require("mongodb");
const dbURL = process.env.DB_URL || "mongodb://127.0.0.1:27017";
const mongoClient = mongodb.MongoClient;
const objectId = mongodb.ObjectID;
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const auth = require("../middlewares/authorization");
require("dotenv").config();
router.use(cors());

// admin login //
router.route("/login").post(async (req, res) => {
  try {
    let clientInfo = await mongoClient.connect(dbURL);
    let db = clientInfo.db("crm");
    let result = await db
      .collection("users")
      .findOne({ email: req.body.email });
    if (result.type == "admin") {
      let isTrue = await bcrypt.compare(req.body.password, result.password);
      let status = result.status;
      if (isTrue) {
        if (status == true) {
          let token = await jwt.sign(
            { userId: result._id, userName: result.name },
            process.env.PASS,
            { expiresIn: "1h" }
          );

          res
            .status(200)
            .json({ message: "admin login success", id: result._id, token });
        } else {
          res.status(200).json({
            message:
              "Please Click on conformation link send to mail to activate your account",
          });
        }
      } else {
        res.status(200).json({ message: "Login unsuccessful" });
      }
    } else {
      res.status(400).json({ message: "You are not allowed to login" });
    }

    clientInfo.close();
  } catch (error) {
    console.log(error);
  }
});


module.exports=router;
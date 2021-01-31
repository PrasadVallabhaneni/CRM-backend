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

// add employee route by admin / manager //

router.route("/add-user").post(auth, async (req, res) => {
  try {
    let clientInfo = await mongoClient.connect(dbURL);
    let db = clientInfo.db("crm");
    let result = await db
      .collection("users")
      .findOne({ email: req.body.email });
    if (result) {
      res.status(400).json({ message: "User already registered" });
      clientInfo.close();
    } else {
      let salt = await bcrypt.genSalt(15);
      let hash = await bcrypt.hash(req.body.password, salt);
      req.body.password = hash;
      await db.collection("users").insertOne(req.body);

      //    var string = Math.random().toString(36).substr(2, 10);
      //    let transporter = nodemailer.createTransport({
      //      host: "smtp.gmail.com",
      //      port: 587,
      //      secure: false, // true for 465, false for other ports
      //      auth: {
      //        user: process.env.SENDER, // generated ethereal user
      //        pass: process.env.PASS, // generated ethereal password
      //      },
      //    });

      //    // send mail with defined transport object
      //    let info = await transporter.sendMail({
      //      from: process.env.SENDER, // sender address
      //      to: req.body.email, // list of receivers
      //      subject: "Activate Account ✔", // Subject line
      //      text: "Hello world?", // plain text body
      //      html: `<a href="${process.env.URL}/activate/${req.body.email}/${string}">Click on this link to activate your account</a>`, // html body
      //    });
      await db
        .collection("users")
        .updateOne({ email: req.body.email }, { $set: { status: true } });
      res.status(200).json({
        message: "User registered successfully.",
        status: "sent",
      });
      clientInfo.close();
    }
  } catch (error) {
    console.log(error);
  }
});

// manager login //
router.route("/login").post(async (req, res) => {
  try {
    let clientInfo = await mongoClient.connect(dbURL);
    let db = clientInfo.db("crm");
    let result = await db
      .collection("users")
      .findOne({ email: req.body.email });
    if (result.type == "manager") {
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
            .json({ message: "manager login success", id: result._id, token });
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

// set user position //
router.route("/position").put(auth, async (req, res) => {
  try {
    let clientInfo = await mongoClient.connect(dbURL);
    let db = clientInfo.db("crm");
    let result = await db
      .collection("users")
      .findOne({ email: req.body.email });
    if (result) {
      var response = await db
        .collection("users")
        .updateOne(
          { email: req.body.email },
          { $set: { position: req.body.position } }
        );

      if (response) {
        res.status(200).json({ message: "position updated", response });
      } else {
        res.status(200).json({ message: "position not updated " });
      }
    } else {
      res.status(200).json({ message: "users doesnt exist" });
    }

    clientInfo.close();
  } catch (error) {
    console.log(error);
    res.send(500);
  }
});



// get all leads //
router.route("/leads").get(auth, async (req, res) => {
  try {
    let clientInfo = await mongoClient.connect(dbURL);
    let db = clientInfo.db("crm");
    let result = await db.collection("leads").find().toArray();
    let count = await db.collection("leads").find().count();
    if (result) {
      res.status(200).json({count,result});
    } else {
      res.status(200).json({ message: "no leads found" });
    }

    clientInfo.close();
  } catch (error) {
    console.log(error);
    res.send(500);
  }
});


// get all services //
router.route("/services").get(auth, async (req, res) => {
  try {
    let clientInfo = await mongoClient.connect(dbURL);
    let db = clientInfo.db("crm");
    let result = await db.collection("services").find().toArray();
    let count = await db.collection("services").find().count();
    if (result) {
      res.status(200).json({count,result});
    } else {
      res.status(200).json({ message: "no services found" });
    }

    clientInfo.close();
  } catch (error) {
    console.log(error);
    res.send(500);
  }
});

// get all contacts / /
  router.route("/services").get(auth, async (req, res) => {
    try {
      let clientInfo = await mongoClient.connect(dbURL);
      let db = clientInfo.db("crm");
      let result = await db.collection("contacts").find().toArray();
      let count = await db.collection("contacts").find().count();
     if(result.length===0) {
        res.status(200).json({ message: "no contacts found" });
      }else if(result) {
        res.status(200).json({ count, result });
      } 

      clientInfo.close();
    } catch (error) {
      console.log(error);
      res.send(500);
    }
  });

// get leads on selected status //
router.route("/leads/:status").get(auth, async (req, res) => {
  try {
    let clientInfo = await mongoClient.connect(dbURL);
    let db = clientInfo.db("crm");
    var result = await db
      .collection("leads")
      .find({ "lead.status": req.params.status })
      .toArray();
    if (result) {
      res.status(200).json(result);
    } else {
      res.status(200).json({ message: "no leads found" });
    }

    clientInfo.close();
  } catch (error) {
    console.log(error);
    res.send(500);
  }
});

// get services on selected status //
router.route("/services/:status").get(auth, async (req, res) => {
  try {
    let clientInfo = await mongoClient.connect(dbURL);
    let db = clientInfo.db("crm");
    var result = await db
      .collection("services")
      .find({ "service.status": req.params.status })
      .toArray();
    if (result) {
      res.status(200).json(result);
    } else {
      res.status(200).json({ message: "no leads found" });
    }

    clientInfo.close();
  } catch (error) {
    console.log(error);
    res.send(500);
  }
});


// get users who are not in active position  //

router.route("/offusers").get(auth, async (req, res) => {
  try {
    let clientInfo = await mongoClient.connect(dbURL);
    let db = clientInfo.db("crm");
    let result = await db
      .collection("users")
      .find({ position:'off' }).toArray();
   res.status(200).json(result)

    clientInfo.close();
  } catch (error) {
    console.log(error);
    res.send(500);
  }
});

module.exports = router;

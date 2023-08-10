//jshint esversion:6
require('dotenv').config();
const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const ejs = require("ejs");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");
const md5 = require("md5");
mongoose.connect('mongodb://127.0.0.1:27017/userDB');


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));



app.use(express.static("public"));

// creating schema
const userSchema = new mongoose.Schema({
    email:String,
    password:String
   });

//encryption

// userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]});   // encryptedfield - only encrypts password tab and not the email tab


const User = mongoose.model("User",userSchema);
   


app.get("/",function(req,res){
    res.render("home");
});

app.get("/login",function(req,res){
    res.render("login");
});

app.get("/register",function(req,res){
    res.render("register");
});

app.post("/register",function(req,res){
    const newUser = new User({
        email:req.body.username,
        password: md5(req.body.password)  // md5 > turns password into irreversible hash
    });

    newUser.save().then(savedDoc => {
        savedDoc === newUser; // true
      });
      
    res.render("secrets");
});

app.post("/login",function(req,res){
   const username = req.body.username;
   const password = md5(req.body.password);
   User.findOne({'email':username})
   .then(function (userFound) {
        if(userFound.password == password){
            res.render("secrets");
        }
   })
   .catch(function (err) {
       console.log(err);
       res.send("Did not find user");
    })
});

app.listen(3000, function() {
    console.log("Server started on port 3000");
  });
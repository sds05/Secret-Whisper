//jshint esversion:6
require('dotenv').config();
const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const ejs = require("ejs");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5");
// const bcrypt = require("bcrypt");
// const saltRounds = 10;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");



app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static("public"));

app.use(session({
    secret: "This is my huge secret.",
    resave: false,
    saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://127.0.0.1:27017/userDB');

// creating schema
const userSchema = new mongoose.Schema({
    email:String,
    password:String,
    googleId:String,
    secret:Array
});

//encryption

// userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]});   // encryptedfield - only encrypts password tab and not the email tab
userSchema.plugin(passportLocalMongoose); // hash+salt and save users in database
userSchema.plugin(findOrCreate);

const User = mongoose.model("User",userSchema);


passport.use(User.createStrategy());
// use static serialize and deserialize of model for passport session support
passport.serializeUser(function(user, done) {
    done(null, user);
  });
   
passport.deserializeUser(function(user, done) {
done(null, user);
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/",function(req,res){
    res.render("home");
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ['profile'] }));  // use passport to authenticate user using google strategy

app.get('/auth/google/secrets', 
passport.authenticate('google', { failureRedirect: '/login' }),
function(req, res) {
// Successful authentication, redirect secrets page.
res.redirect('/secrets');
});


app.get("/login",function(req,res){
    res.render("login");
});

app.get("/register",function(req,res){
    res.render("register");
});

app.get("/secrets",function(req,res){
    User.find({"secret":{$ne:null}})
    .then(function (foundUsers) {
      res.render("secrets",{usersWithSecrets:foundUsers});
      })
    .catch(function (err) {
      console.log(err);
      })
});

app.get("/submit",function(req,res){
    // user is already logged in
    if(req.isAuthenticated()){
        res.render("submit");
    }
    else{
        res.redirect("/login");
    }
});

app.get('/logout', function(req, res, next){
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
  });

app.post("/submit",function(req,res){
    const userSecret = req.body.secret;
    // console.log(req);
    User.findById(req.user)
    .then(foundUser => {
      if (foundUser) {
        foundUser.secret.push(userSecret);
        return foundUser.save();
      }
      return null;
    })
    .then(() => {
      res.redirect("/secrets");
    })
    .catch(err => {
      console.log(err);
    });
});

app.post("/register",function(req,res){

    User.register({username:req.body.username},req.body.password,function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }
        else{
            // autheticate the user or like store the user credentials (create a cookie basically)
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    });

  
});

app.post("/login",function(req,res){

    const newUser = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(newUser,function(err){
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }

    });
   
});

app.listen(3000, function() {
    console.log("Server started on port 3000");
  });
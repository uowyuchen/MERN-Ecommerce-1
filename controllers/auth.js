const User = require("../models/user");
// for generating signed token
const jwt = require("jsonwebtoken");
// for authorization check
const expressJwt = require("express-jwt");

const { errorHandler } = require("../helpers/dbErrorHandler");

exports.signup = (req, res) => {
  //console.log("req.body", req.body);//返回所有输入的object
  const user = new User(req.body);

  user.save((err, user) => {
    if (err) {
      return res.status(400).json({
        error: "Email Already Exists"
        
      });
    }
    user.salt = undefined;
    user.hashed_password = undefined;
    res.json({ user });
  });
};

exports.signin = (req, res) => {
  // find the user based on email
  const { email, password } = req.body;
  User.findOne({ email }, (err, user) => {
    // if no user found
    if (err || !user) {
      return res.status(400).json({
        error: "User with that email does not exist. Please signup"
      });
    }
    // if found user
    // create authenticate method in user model
    if (!user.authenticate(password)) {
      return res.status(401).json({ error: "Email and password do not match" });
    }
    // generate a signed token with us1er id and secret
    // 这个{ id: user.id }就是token的payload, 也可以把整个user对象都放里面，但不安全呀
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
    // persist the token as 't' in cookie with expiry data
    res.cookie("t", token, { expire: new Date() + 9999 });
    // return response with user and token to frontend client
    const { id, name, email, role } = user;
    return res.json({ token, user: { id, email, name, role } });
  });
};

exports.signout = (req, res) => {
  res.clearCookie("t");
  res.json({ message: "signout success" });
};

// jsonwebtoken只是用来生成token的，当然jsonwebtoken也可以verify token但是麻烦，
// 所以我们用express-jwt帮助我们来验证token，只要把下面的object放入router中即可
exports.requireSignin = expressJwt({
  secret: process.env.JWT_SECRET, // 只要把SECRET放在这，就能verify登录时候的token
  userProperty: "auth"
});

exports.isAuth = (req, res, next) => {
  let user = req.profile && req.auth && req.profile.id == req.auth.id;
  if (!user) {
    return res.status(403).json({
      error: "Access denied"
    });
  }
  next();
};

exports.isAdmin = (req, res, next) => {
  // 1 是 admin
  if (req.profile.role === 0) {
    return res.status(403).json({
      error: "Admin resourse! Access denied"
    });
  }
  next();
};

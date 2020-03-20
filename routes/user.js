const express = require("express");
const router = express.Router();

const {
  userById,
  read,
  update,
  purchaseHistory
} = require("../controllers/user");
const { requireSignin, isAdmin, isAuth } = require("../controllers/auth");

router.get("/secret/:userId", requireSignin, isAdmin, isAuth, (req, res) => {
  console.log("2");
  console.log(req.auth);
  console.log("3");
  console.log(req.user);
  res.json({ user: req.profile });
});

// get single user information
router.get("/users/:userId", requireSignin, isAuth, read);
// update single user information
router.put("/users/:userId", requireSignin, isAuth, update);

// get user's purchase history
router.get("/orders/by/user/:userId", requireSignin, isAuth, purchaseHistory);

// 下面👇的作用是相当于session的时候把user放入req.user；当前jwt的时候把user放入req.profile
router.param("userId", userById);

module.exports = router;

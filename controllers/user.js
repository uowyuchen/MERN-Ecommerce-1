const User = require("../models/user");

// 这一段是一个middleware
exports.userById = (req, res, next, id) => {
  User.findById(id).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User not found"
      });
    }
    // profile可以是任意值
    req.profile = user;
    // console.log("1");
    next();
  });
};

// 读取user信息
exports.read = (req, res) => {
  // 因为url中有userId，所以req.profile在此时已经保存了登录的user信息了
  // 获取user信息的时候，为了安全🔐需要，把密码暂时undefined
  req.profile.hashed_password = undefined;
  req.profile.salt = undefined;
  // 还记得userById吗，user信息就在req.profile里面
  return res.json(req.profile);
};

// update user
exports.update = (req, res) => {
  User.findByIdAndUpdate(
    { id: req.profile.id },
    { $set: req.body },
    { new: true },
    (err, user) => {
      if (err || !user) {
        return res.status(400).json({
          error: "You are not authorized to perform this action"
        });
      }
      user.hashed_password = undefined;
      user.salt = undefined;
      // return the updated user info to frontend
      res.json(user);
    }
  );
};

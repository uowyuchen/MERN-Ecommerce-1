const User = require("../models/user");
const { errorHandler } = require("../helpers/dbErrorHandler");
const { Order } = require("../models/order");

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
// exports.update = (req, res) => {
//   User.findByIdAndUpdate(
//     { id: req.profile.id },
//     { $set: req.body },
//     { new: true },
//     (err, user) => {
//       if (err || !user) {
//         return res.status(400).json({
//           error: "You are not authorized to perform this action"
//         });
//       }
//       user.hashed_password = undefined;
//       user.salt = undefined;
//       // return the updated user info to frontend
//       res.json(user);
//     }
//   );
// };
exports.update = (req, res) => {
  // console.log('UPDATE USER - req.user', req.user, 'UPDATE DATA', req.body);
  const { name, password } = req.body;

  User.findOne({ _id: req.profile._id }, (err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User not found"
      });
    }
    if (!name) {
      return res.status(400).json({
        error: "Name is required"
      });
    } else {
      user.name = name;
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          error: "Password should be min 6 characters long"
        });
      } else {
        user.password = password;
      }
    }

    user.save((err, updatedUser) => {
      if (err) {
        console.log("USER UPDATE ERROR", err);
        return res.status(400).json({
          error: "User update failed"
        });
      }
      updatedUser.hashed_password = undefined;
      updatedUser.salt = undefined;
      res.json(updatedUser);
    });
  });
};

// add user purchase order to order history
exports.addOrderToUserHistory = (req, res, next) => {
  let history = [];
  req.body.order.products.forEach(product => {
    history.push({
      _id: product._id,
      name: product.name,
      description: product.description,
      category: product.category,
      quantity: product.count,
      transaction_id: req.body.order.transaction_id,
      amount: req.body.order.amount
    });
  });

  User.findOneAndUpdate(
    { _id: req.profile._id },
    { $push: { history: history } },
    { new: true },
    (error, data) => {
      if (error) {
        return res.status(400).json({
          error: "Could not update user purchase history"
        });
      }
      next();
    }
  );
};

// get user's purchase history
exports.purchaseHistory = (req, res) => {
  Order.find({ user: req.profile._id })
    .populate("user", "_id name")
    .sort("-create")
    .exec((err, orders) => {
      if (err) {
        return res.status(400).json({ error: errorHandler(err) });
      }
      res.json(orders);
    });
};

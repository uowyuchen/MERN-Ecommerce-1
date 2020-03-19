const express = require("express");
const router = express.Router();
const { requireSignin, isAuth, isAdmin } = require("../controllers/auth");
const { userById, addOrderToUserHistory } = require("../controllers/user");
const {
  create,
  listOrders,
  getStatusValues,
  orderById,
  updateOrderStatus
} = require("../controllers/order");
const { decreaseQuantity } = require("../controllers/product");

router.post(
  "/order/create/:userId",
  requireSignin,
  isAuth,
  addOrderToUserHistory, // 在create order之前，要执行把history放入user DB中
  decreaseQuantity,
  create
);

router.get("/order/list/:userId", requireSignin, isAuth, isAdmin, listOrders);

// get order status (processing, delivered等)
router.get(
  "/order/status-values/:userId",
  requireSignin,
  isAuth,
  isAdmin,
  getStatusValues
);

// update order status (processing, delivered等)
router.put(
  "/order/:orderId/status/:userId",
  requireSignin,
  isAuth,
  isAdmin,
  updateOrderStatus
);
router.param("userId", userById);
router.param("orderId", orderById);

module.exports = router;

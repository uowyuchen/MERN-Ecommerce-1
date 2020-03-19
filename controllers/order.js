const { Order, CartItem } = require("../models/order");
const { errorHandler } = require("../helpers/dbErrorHandler");

// get order by id
exports.orderById = (req, res, next, id) => {
  Order.findById(id)
    .populate("products.product", "name price")
    .exec((error, order) => {
      if (error) {
        return res.status(400).json({
          error: errorHandler(error)
        });
      }
      req.order = order;
      next();
    });
};

exports.create = (req, res) => {
  // console.log("create order: ", req.body);
  req.body.order.user = req.profile;
  const order = new Order(req.body.order);
  order.save((error, savedOrder) => {
    if (error) {
      return res.status(400).json({
        error: errorHandler(error)
      });
    }
    res.json(savedOrder);
  });
};

// list orders for admin
exports.listOrders = (req, res) => {
  Order.find()
    .populate("user", "_id name address")
    .sort("-created")
    .exec((error, orders) => {
      if (error) {
        return res.status(400).json({
          error: errorHandler(error)
        });
      }
      console.log(orders);
      res.json(orders);
    });
};

// get order status (the enum in order model)
exports.getStatusValues = (req, res) => {
  res.json(Order.schema.path("status").enumValues);
};

// update order status
exports.updateOrderStatus = (req, res) => {
  Order.update(
    { _id: req.body.orderId },
    { $set: { status: req.body.status } },
    (error, updatedOrder) => {
      if (error) {
        return res.status(400).json({
          error: errorHandler(error)
        });
      }
      res.json(updatedOrder);
    }
  );
};

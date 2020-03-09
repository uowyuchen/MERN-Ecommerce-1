const Category = require("../models/category");
const { errorHandler } = require("../helpers/dbErrorHandler");

exports.categoryById = (req, res, next, id) => {
  Category.findById(id).exec((err, foundCategory) => {
    if (err) {
      return res.status(400).json({
        error: "Category does not exist"
      });
    }
    req.category = foundCategory;
    next();
  });
};

// create a new category
exports.create = (req, res) => {
  // receive user's input
  const category = new Category(req.body);

  category.save((err, savedCategory) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err)
      });
    }
    res.json({ savedCategory });
  });
};

// get a category
exports.read = (req, res) => {
  return res.json(req.category);
};

// update category
exports.update = (req, res) => {
  const category = req.category;
  category.name = req.body.name;
  category.save((err, updatedCategory) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err)
      });
    }
    res.json({ updatedCategory });
  });
};

// remove category
exports.remove = (req, res) => {
  const category = req.category;
  category.remove((err, deletedCategory) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err)
      });
    }
    res.json({ message: "Category deleted" });
  });
};

// list all categories
exports.list = (req, res) => {
  Category.find().exec((err, allCategories) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err)
      });
    }
    res.json(allCategories);
  });
};

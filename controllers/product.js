const formidable = require("formidable");
const _ = require("lodash");
const fs = require("fs");
const Product = require("../models/product");
const { errorHandler } = require("../helpers/dbErrorHandler");

// 和userById一摸一样
exports.productById = (req, res, next, id) => {
  Product.findById(id).exec((err, product) => {
    if (err || !product) {
      return res.status(400).json({
        error: "Product not found"
      });
    }
    req.product = product;
    next();
  });
};

// create a new product
exports.create = (req, res) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;
  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        error: "Image could not be uploaded"
      });
    }

    // // Validation for all fields
    const { name, description, price, category, quantity, shipping } = fields;
    // validate fields
    if (
      !name ||
      !description ||
      !price ||
      !category ||
      !quantity ||
      !shipping
    ) {
      return res.status(400).json({
        error: "All fields are required"
      });
    }

    // if no error
    let product = new Product(fields);
    // save photo to product separately
    if (files.photo) {
      // Validation for image size
      if (files.photo.size > 2000000) {
        return res.status(400).json({
          error: "Image should be less than 2mb in size"
        });
      }
      product.photo.data = fs.readFileSync(files.photo.path);
      product.photo.contentType = files.photo.type;
    }

    product.save((err, savedProduct) => {
      if (err) {
        return res.status(400).json({
          error: errorHandler(err)
        });
      }
      res.json(savedProduct);
    });
  });
};

// get product
exports.read = (req, res) => {
  req.product.photo = undefined;
  return res.json(req.product);
};

// remove product
exports.remove = (req, res) => {
  let product = req.product;
  product.remove((err, deletedProduct) => {
    if (err || !product) {
      return res.status(400).json({
        error: errorHandler(err)
      });
    }
    res.json({
      message: "Product deleted successfully"
    });
  });
};

// update product
exports.update = (req, res) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions = true; // keep file extension
  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        error: "Image could not be uploaded"
      });
    }
    // // Validation for all fields
    const { name, description, price, category, quantity, shipping } = fields;
    if (
      !name ||
      !description ||
      !price ||
      !category ||
      !quantity ||
      !shipping
    ) {
      return res.status(400).json({
        error: "All fields are required"
      });
    }

    // 因为param所以用到了productById，所以我们有req.product
    let product = req.product;
    // user lodash to update object
    product = _.extend(product, fields);

    if (files.photo) {
      // Validation for image size
      if (files.photo.size > 2000000) {
        return res.status(400).json({
          error: "Image should be less than 2mb in size"
        });
      }
      product.photo.data = fs.readFileSync(files.photo.path);
      product.photo.contentType = files.photo.type;
    }

    product.save((err, savedProduct) => {
      if (err) {
        return res.status(400).json({
          error: errorHandler(err)
        });
      }
      res.json(savedProduct);
    });
  });
};

/**
 * sell / arrival
 * by sell = /products?sortBy=sold&order=desc&limit=4
 * by arrival = /products?sortBy=createdAt&order=desc&limit=4
 * if no params are sent, then all products are returned
 */
exports.list = (req, res) => {
  let order = req.query.order ? req.query.order : "asc";
  let sortBy = req.query.sortBy ? req.query.sortBy : "id";
  let limit = req.query.limit ? parseInt(req.query.limit) : 6;

  Product.find()
    .select("-photo") // 不选photo是因为，photo是一大堆二进制，留着以后处理
    .populate("category")
    .sort([[sortBy, order]]) // [[id, asc]]
    .limit(limit)
    .exec((err, foundProduct) => {
      if (err) {
        return res.status(400).json({
          error: "Products not found"
        });
      }
      res.send(foundProduct);
    });
};

// it will find the products based on the req product category
exports.listRelated = (req, res) => {
  let limit = req.query.limit ? parseInt(req.query.limit) : 6;
  // $ne: not include 为什么不include自己？我还不知道为什么！
  // 解释：比如category是react系列，我们找到所有react的书，但不包括自己。不知道为什么。
  Product.find({ id: { $ne: req.product }, category: req.product.category })
    .limit(limit)
    .populate("category", "_id name")
    .exec((err, products) => {
      if (err) {
        return res.status(400).json({
          error: "Products not found"
        });
      }
      res.json(products);
    });
};

// 就是找到各种不同的categories
exports.listCategories = (req, res) => {
  Product.distinct("category", {}, (err, categories) => {
    if (err) {
      return res.status(400).json({
        error: "Category not found"
      });
    }
    res.json(categories);
  });
};

/**
 * list products by search
 * we will implement product search in react frontend
 * we will show categories in checkbox and price range in radio buttons
 * as the user clicks on those checkbox and radio buttons
 * we will make api request and show the products to users based on what he wants
 */
exports.listBySearch = (req, res) => {
  let order = req.body.order ? req.body.order : "desc";
  let sortBy = req.body.sortBy ? req.body.sortBy : "_id";
  let limit = req.body.limit ? parseInt(req.body.limit) : 100;
  let skip = parseInt(req.body.skip);
  let findArgs = {};

  console.log("1", order, sortBy, limit, skip, req.body.filters);
  console.log("findArgs", findArgs);

  for (let key in req.body.filters) {
    if (req.body.filters[key].length > 0) {
      if (key === "price") {
        // gte -  greater than price [0-10]
        // lte - less than
        findArgs[key] = {
          $gte: req.body.filters[key][0],
          $lte: req.body.filters[key][1]
        };
        // console.log("2", findArgs[key]);
        // console.log("4", findArgs);
      } else {
        findArgs[key] = req.body.filters[key];
        // console.log("3", findArgs[key]);
      }
    }
  }

  Product.find(findArgs)
    .select("-photo")
    .populate("category")
    .sort([[sortBy, order]])
    .skip(skip)
    .limit(limit)
    .exec((err, data) => {
      if (err) {
        return res.status(400).json({
          error: "Products not found"
        });
      }
      res.json({
        size: data.length,
        data
      });
    });
};

exports.photo = (req, res, next) => {
  if (req.product.photo.data) {
    // 这个content type其实就是上传文件的后缀，比如: png,jpg,pdf等等
    // set contentType，再把photo.data发送到前端就可以显示出图片了
    res.set("Content-Type", req.product.photo.contentType);
    return res.send(req.product.photo.data);
  }
  next(); // 这个next在这里有什么用我还不知道
};

exports.listSearch = (req, res) => {
  // create query object to hold search value & category value
  const query = {};
  // assign search value to query.name
  if (req.query.search) {
    // $regex是mongo给我们的search方法，“ℹ”作用是不区分大小写
    // 必须齐名为name，因为要和product model中的name一样，我们是按照product的name搜的
    query.name = { $regex: req.query.search, $options: "i" };
    // assign category value to query.category
    if (req.query.category && req.query.category != "All") {
      query.category = req.query.category;
    }

    // console.log("query", query);
    // query {
    //   name: { '$regex': 'book', '$options': 'i' },
    //   category: '5e49e6d9a7e3348458fb3d7a'
    // }

    // find the product based on query object with 2 properties
    Product.find(query, (err, products) => {
      if (err) {
        return res.status(400).json({ error: errorHandler(err) });
      }
      res.json(products);
    }).select("-photo");
  }
};

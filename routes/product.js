const express = require("express");
const router = express.Router();
const {
  create,
  productById,
  read,
  remove,
  update,
  list,
  listRelated,
  listCategories,
  listBySearch,
  photo,
  listSearch,
  listAllProductsForAdmin
} = require("../controllers/product");
const { requireSignin, isAuth, isAdmin } = require("../controllers/auth");
const { userById } = require("../controllers/user");

// get one product
router.get("/product/:productId", read);

// create a new product
router.post("/product/create/:userId", requireSignin, isAuth, isAdmin, create);

// delete a product
router.delete(
  "/product/:productId/:userId",
  requireSignin,
  isAuth,
  isAdmin,
  remove
);

// update a prodcut
router.put(
  "/product/:productId/:userId",
  requireSignin,
  isAuth,
  isAdmin,
  update
);

// get all products or 有条件的list all products
router.get("/products", list);

router.get("/products/admin", listAllProductsForAdmin);

// list all related products
router.get("/products/related/:productId", listRelated);

// list products by category
router.get("/products/categories", listCategories);

// search products
router.post("/products/by/search", listBySearch);

// search product for shop page
router.get("/products/search", listSearch);

// get product photo
router.get("/products/photo/:productId", photo);

router.param("userId", userById);
router.param("productId", productById);

module.exports = router;

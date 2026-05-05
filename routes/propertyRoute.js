const express = require("express");
const {
  createPropertyValidator,
  updatePropertyValidator,
  getPropertyValidator,
  deletePropertyValidator,
} = require("../utils/validators/propertyValidator");

const {
  getProperties,
  getFeaturedProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  uploadPropertyImages,
  resizePropertyImages,
  getMyProperties,
} = require("../controllers/propertyController");

const { protect, allowedTo } = require("../controllers/authController");

const router = express.Router();

router.get("/featured", getFeaturedProperties);
router.get("/my-properties", protect, getMyProperties);

router
  .route("/")
  .get(getProperties)
  .post(
    protect,
    uploadPropertyImages,
    resizePropertyImages,
    createPropertyValidator,
    createProperty
  );

router
  .route("/:id")
  .get(getPropertyValidator, getProperty)
  .put(
    protect,
    uploadPropertyImages,
    resizePropertyImages,
    updatePropertyValidator,
    updateProperty
  )
  .delete(protect, deletePropertyValidator, deleteProperty);

module.exports = router;

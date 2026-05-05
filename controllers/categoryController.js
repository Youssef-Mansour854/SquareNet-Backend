const asyncHandler = require("express-async-handler");
const slugify = require("slugify");

const CategoryModel = require("../models/CategoryModel");
const ApiError = require("../utils/apiError");
const ApiFeatures = require("../utils/apiFeatures");
const { uploadSingleImage } = require("../middlewares/uploadImageMiddleware");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
const { uploadToCloudinary } = require("../utils/cloudinaryHelper");

exports.uploadCategoryImage = uploadSingleImage("image");

exports.resizeCategoryImage = asyncHandler(async (req, res, next) => {
  if (!req.file) return next();

  const publicId = `category-${uuidv4()}-${Date.now()}`;

  const processedBuffer = await sharp(req.file.buffer)
    .resize(600, 600)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toBuffer();

  // Upload to Cloudinary
  const imageUrl = await uploadToCloudinary(
    processedBuffer,
    "squarenet/categories",
    publicId
  );

  req.body.image = imageUrl;
  next();
});

exports.getCategories = asyncHandler(async (req, res) => {
  const apiFeatures = new ApiFeatures(CategoryModel.find(), req.query)
    .filter()
    .search(["name"]);

  const documentsCount = await apiFeatures.mongooseQuery.clone().countDocuments();

  apiFeatures.sort().limitFields().paginate(documentsCount);

  const categories = await apiFeatures.mongooseQuery;

  res.status(200).json({
    status: "success",
    results: categories.length,
    paginationResult: apiFeatures.paginationResult,
    data: categories,
  });
});

exports.getCategory = asyncHandler(async (req, res, next) => {
  const category = await CategoryModel.findById(req.params.id);

  if (!category) {
    return next(new ApiError("Category not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: category,
  });
});

exports.createCategory = asyncHandler(async (req, res) => {
  if (req.body.name) {
    req.body.slug = slugify(req.body.name, { lower: true, strict: true });
  }

  const category = await CategoryModel.create(req.body);

  res.status(201).json({
    status: "success",
    data: category,
  });
});

exports.updateCategory = asyncHandler(async (req, res, next) => {
  if (req.body.name) {
    req.body.slug = slugify(req.body.name, { lower: true, strict: true });
  }

  const category = await CategoryModel.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!category) {
    return next(new ApiError("Category not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: category,
  });
});

exports.deleteCategory = asyncHandler(async (req, res, next) => {
  const category = await CategoryModel.findByIdAndDelete(req.params.id);

  if (!category) {
    return next(new ApiError("Category not found", 404));
  }

  res.status(204).send();
});

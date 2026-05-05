const asyncHandler = require("express-async-handler");
const slugify = require("slugify");

const CategoryModel = require("../models/CategoryModel");
const PropertyModel = require("../models/PropertyModel");
const ApiError = require("../utils/apiError");
const ApiFeatures = require("../utils/apiFeatures");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
const { uploadToCloudinary } = require("../utils/cloudinaryHelper");
const { uploadMixOfImages } = require("../middlewares/uploadImageMiddleware");


const preparePropertyPayload = async (payload) => {
  if (payload.title) {
    payload.slug = slugify(payload.title, { lower: true, strict: true });
  }

  if (payload.category) {
    const categoryExists = await CategoryModel.findById(payload.category);

    if (!categoryExists) {
      throw new ApiError("Category not found", 404);
    }
  }
};

exports.uploadPropertyImages = uploadMixOfImages([
  { name: "image", maxCount: 1 },
  { name: "images", maxCount: 10 },
]);

exports.resizePropertyImages = asyncHandler(async (req, res, next) => {
  if (!req.files) return next();

  // 1. Image processing for main image
  if (req.files.image) {
    const publicId = `property-${uuidv4()}-${Date.now()}-main`;

    const processedBuffer = await sharp(req.files.image[0].buffer)
      .resize(600, 600)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toBuffer();

    // Upload to Cloudinary and save URL in db body
    req.body.image = await uploadToCloudinary(
      processedBuffer,
      "squarenet/properties",
      publicId
    );
  }

  // 2. Image processing for multiple images
  if (req.files.images) {
    req.body.images = [];
    await Promise.all(
      req.files.images.map(async (img, index) => {
        const publicId = `property-${uuidv4()}-${Date.now()}-${index + 1}`;

        const processedBuffer = await sharp(img.buffer)
          .resize(600, 600)
          .toFormat("jpeg")
          .jpeg({ quality: 90 })
          .toBuffer();

        const url = await uploadToCloudinary(
          processedBuffer,
          "squarenet/properties",
          publicId
        );
        req.body.images.push(url);
      })
    );
  }

  next();
});

exports.getProperties = asyncHandler(async (req, res) => {
  const apiFeatures = new ApiFeatures(PropertyModel.find(), req.query)
    .filter()
    .search(["title", "location", "type", "description"]);

  const documentsCount = await apiFeatures.mongooseQuery.clone().countDocuments();

  apiFeatures.sort().limitFields().paginate(documentsCount);
  apiFeatures.mongooseQuery = apiFeatures.mongooseQuery
    .populate("category", "name slug image")
    .populate("ownerId", "name email phone profileImg");

  const properties = await apiFeatures.mongooseQuery;

  res.status(200).json({
    status: "success",
    results: properties.length,
    paginationResult: apiFeatures.paginationResult,
    data: properties,
  });
});

exports.getFeaturedProperties = asyncHandler(async (req, res) => {
  const properties = await PropertyModel.find({ featured: true })
    .sort("-dateAdded -createdAt")
    .limit(6)
    .select("-__v")
    .populate("category", "name slug image");

  res.status(200).json({
    status: "success",
    results: properties.length,
    data: properties,
  });
});

exports.getProperty = asyncHandler(async (req, res, next) => {
  const property = await PropertyModel.findById(req.params.id)
    .populate("category", "name slug image")
    .populate("ownerId", "name email phone profileImg");

  if (!property) {
    return next(new ApiError("Property not found", 404));
  }

  // Increment view counter
  await PropertyModel.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

  res.status(200).json({
    status: "success",
    data: property,
  });
});

exports.createProperty = asyncHandler(async (req, res) => {
  await preparePropertyPayload(req.body);

  // Auto-set owner from logged-in user
  if (req.user) {
    req.body.ownerId = req.user._id;
    if (!req.body.listedBy) {
      req.body.listedBy = req.user.name;
    }
    if (!req.body.contactPhone && req.user.phone) {
      req.body.contactPhone = req.user.phone;
    }
  }

  const property = await PropertyModel.create(req.body);

  const createdProperty = await PropertyModel.findById(property._id)
    .populate("category", "name slug image")
    .populate("ownerId", "name email phone profileImg");

  res.status(201).json({
    status: "success",
    data: createdProperty,
  });
});

exports.updateProperty = asyncHandler(async (req, res, next) => {
  await preparePropertyPayload(req.body);

  const existingProperty = await PropertyModel.findById(req.params.id);
  if (!existingProperty) {
    return next(new ApiError("Property not found", 404));
  }

  // Check ownership (owner or admin)
  if (
    req.user &&
    existingProperty.ownerId &&
    existingProperty.ownerId.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin' && req.user.role !== 'superadmin'
  ) {
    return next(new ApiError("You are not allowed to update this property", 403));
  }

  const property = await PropertyModel.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate("category", "name slug image")
    .populate("ownerId", "name email phone profileImg");

  res.status(200).json({
    status: "success",
    data: property,
  });
});

exports.deleteProperty = asyncHandler(async (req, res, next) => {
  const property = await PropertyModel.findById(req.params.id);

  if (!property) {
    return next(new ApiError("Property not found", 404));
  }

  // Check ownership (owner or admin)
  if (
    req.user &&
    property.ownerId &&
    property.ownerId.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin' && req.user.role !== 'superadmin'
  ) {
    return next(new ApiError("You are not allowed to delete this property", 403));
  }

  await PropertyModel.findByIdAndDelete(req.params.id);

  res.status(204).send();
});

// @desc    Get properties by owner
// @route   GET /api/v1/properties/my-properties
// @access  Protected
exports.getMyProperties = asyncHandler(async (req, res) => {
  const properties = await PropertyModel.find({ ownerId: req.user._id })
    .sort("-createdAt")
    .populate("category", "name slug image");

  res.status(200).json({
    status: "success",
    results: properties.length,
    data: properties,
  });
});

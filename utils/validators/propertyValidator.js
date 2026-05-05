const { check } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');
const Category = require('../../models/CategoryModel');

exports.createPropertyValidator = [
  check('title')
    .notEmpty()
    .withMessage('Property title is required')
    .isLength({ min: 5 })
    .withMessage('Too short property title')
    .isLength({ max: 120 })
    .withMessage('Too long property title'),
  
  check('description')
    .notEmpty()
    .withMessage('Property description is required')
    .isLength({ min: 20 })
    .withMessage('Too short property description')
    .isLength({ max: 2000 })
    .withMessage('Too long property description'),

  check('location')
    .notEmpty()
    .withMessage('Property location is required')
    .isLength({ max: 120 })
    .withMessage('Too long property location'),

  check('type')
    .notEmpty()
    .withMessage('Property type is required')
    .isLength({ max: 60 })
    .withMessage('Too long property type'),

  check('purpose')
    .optional()
    .isIn(['sale', 'rent'])
    .withMessage('purpose must be sale or rent'),

  check('price')
    .notEmpty()
    .withMessage('Property price is required')
    .isNumeric()
    .withMessage('Property price must be a number')
    .custom((val) => {
        if (val < 0) {
            throw new Error('Price must be greater than or equal to 0');
        }
        return true;
    }),

  check('area')
    .notEmpty()
    .withMessage('Property area is required')
    .isNumeric()
    .withMessage('Property area must be a number')
    .custom((val) => {
        if (val < 1) {
            throw new Error('Area must be greater than 0');
        }
        return true;
    }),

  check('bedrooms')
    .optional()
    .isNumeric()
    .withMessage('Bedrooms must be a number')
    .custom((val) => val >= 0 || Promise.reject(new Error('Bedrooms must be >= 0'))),

  check('bathrooms')
    .optional()
    .isNumeric()
    .withMessage('Bathrooms must be a number')
    .custom((val) => val >= 0 || Promise.reject(new Error('Bathrooms must be >= 0'))),

  check('latitude')
    .optional({ values: 'falsy' })
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be a number between -90 and 90')
    .custom((value, { req }) => {
      if (value !== undefined && value !== '' && (req.body.longitude === undefined || req.body.longitude === '')) {
        throw new Error('Longitude is required when latitude is provided');
      }
      return true;
    }),

  check('longitude')
    .optional({ values: 'falsy' })
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be a number between -180 and 180')
    .custom((value, { req }) => {
      if (value !== undefined && value !== '' && (req.body.latitude === undefined || req.body.latitude === '')) {
        throw new Error('Latitude is required when longitude is provided');
      }
      return true;
    }),

  check('image')
    .notEmpty()
    .withMessage('Property main image is required'),

  check('images')
    .optional()
    .isArray()
    .withMessage('Images should be an array of strings'),
    
  check('status')
    .optional()
    .isIn(['available', 'reserved', 'sold'])
    .withMessage('Status must be available, reserved, or sold'),
    
  check('contactPhone')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Too long phone number'),

  check('category')
    .optional()
    .isMongoId()
    .withMessage('Invalid Category id format')
    .custom((categoryId) =>
      Category.findById(categoryId).then((category) => {
        if (!category) {
          return Promise.reject(new Error(`No category found for this id: ${categoryId}`));
        }
      })
    ),

  validatorMiddleware,
];

exports.getPropertyValidator = [
  check('id').isMongoId().withMessage('Invalid Property id format'),
  validatorMiddleware,
];

exports.updatePropertyValidator = [
  check('id').isMongoId().withMessage('Invalid Property id format'),
  check('latitude')
    .optional({ values: 'falsy' })
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be a number between -90 and 90'),
  check('longitude')
    .optional({ values: 'falsy' })
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be a number between -180 and 180'),
  validatorMiddleware,
];

exports.deletePropertyValidator = [
  check('id').isMongoId().withMessage('Invalid Property id format'),
  validatorMiddleware,
];

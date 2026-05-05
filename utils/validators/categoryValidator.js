const { check } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');

exports.createCategoryValidator = [
  check('name')
    .notEmpty()
    .withMessage('Category name required')
    .isLength({ min: 3 })
    .withMessage('Category name too short')
    .isLength({ max: 32 })
    .withMessage('Category name too long'),
  validatorMiddleware,
];

exports.getCategoryValidator = [
  check('id').isMongoId().withMessage('Invalid Category id format'),
  validatorMiddleware,
];

exports.updateCategoryValidator = [
  check('id').isMongoId().withMessage('Invalid Category id format'),
  check('name')
    .optional()
    .isLength({ min: 3 })
    .withMessage('Category name too short')
    .isLength({ max: 32 })
    .withMessage('Category name too long'),
  validatorMiddleware,
];

exports.deleteCategoryValidator = [
  check('id').isMongoId().withMessage('Invalid Category id format'),
  validatorMiddleware,
];

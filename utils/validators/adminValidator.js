const { check } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');
const User = require('../../models/userModel');

exports.createAdminValidator = [
  check('name')
    .notEmpty()
    .withMessage('الاسم مطلوب')
    .isLength({ min: 3 })
    .withMessage('الاسم قصير جداً'),

  check('email')
    .notEmpty()
    .withMessage('البريد الإلكتروني مطلوب')
    .isEmail()
    .withMessage('بريد إلكتروني غير صالح')
    .custom((val) =>
      User.findOne({ email: val }).then((user) => {
        if (user) {
          return Promise.reject(new Error('البريد الإلكتروني مستخدم بالفعل'));
        }
      })
    ),

  check('password')
    .notEmpty()
    .withMessage('كلمة المرور مطلوبة')
    .isLength({ min: 6 })
    .withMessage('كلمة المرور يجب أن لا تقل عن 6 أحرف'),

  check('role')
    .optional()
    .isIn(['admin', 'superadmin'])
    .withMessage('صلاحية غير صالحة'),

  validatorMiddleware,
];

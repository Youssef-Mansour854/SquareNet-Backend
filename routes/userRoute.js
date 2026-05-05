const express = require('express');
const {
  createUserValidator,
  updateUserValidator,
  getUserValidator,
  deleteUserValidator,
} = require('../utils/validators/userValidator');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getMe,
  updateMe,
  uploadProfileImage,
  resizeProfileImage,
  updateMyPhoto,
} = require('../controllers/userController');
const { protect, allowedTo } = require('../controllers/authController');

const router = express.Router();

// Protected routes
router.use(protect);

// Logged-in user endpoints
router.get('/me', getMe);
router.put('/me', updateMe);
router.put('/me/photo', uploadProfileImage, resizeProfileImage, updateMyPhoto);

// Only admin and superadmin can manage all users
router.use(allowedTo('admin', 'superadmin'));

router.route('/')
  .get(getUsers)
  .post(createUserValidator, createUser);

router.route('/:id')
  .get(getUserValidator, getUser)
  .put(updateUserValidator, updateUser)
  .delete(deleteUserValidator, deleteUser);

module.exports = router;

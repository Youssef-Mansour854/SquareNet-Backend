const express = require('express');

const authController = require('../controllers/authController');
const {
  addPropertyToWishlist,
  removePropertyFromWishlist,
  getLoggedUserWishlist,
} = require('../controllers/wishlistController');

const router = express.Router();

router.use(authController.protect);

router.route('/').post(addPropertyToWishlist).get(getLoggedUserWishlist);

router.delete('/:propertyId', removePropertyFromWishlist);

module.exports = router;

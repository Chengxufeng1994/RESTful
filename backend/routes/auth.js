const express = require('express');
const { body } = require('express-validator');

const AuthContorller = require('../controller/auth');
const User = require('../models/user');
const isAuth = require('../middleware/isAuth');

const router = express.Router();

router.post('/login', AuthContorller.postLogin);

router.post(
  '/signup',
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email.')
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject(
              'E-Mail exists already, please pick a different one.'
            );
          }
        });
      })
      .normalizeEmail(),
    body('name').trim().notEmpty(),
    body('password')
      .trim()
      .isLength({ min: 5 })
      .withMessage(
        'Please enter a password with only numbers and text and at least 5 characters.'
      ),
  ],
  AuthContorller.signup
);

router.get('/status', isAuth, AuthContorller.getStatus);
router.patch('/status', isAuth, AuthContorller.updateStatus);

module.exports = router;

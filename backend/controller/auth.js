const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const User = require('../models/user');

const saltRounds = 12;

exports.signup = (req, res, next) => {
  console.log('[Post signup]');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed.');
    error.data = errors.array();
    error.statusCode = 422;
    throw error;
  }

  const { email, name, password } = req.body;
  console.log(email, name, password);
  bcrypt
    .hash(password, saltRounds)
    .then((hashedPassword) => {
      // Store hash in your password DB.
      const user = new User({
        email: email,
        name: name,
        password: hashedPassword,
        posts: [],
      });

      return user.save();
    })
    .then((result) => {
      res.status(201).json({
        message: 'User created successfully!',
        userId: result._id,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.postLogin = (req, res, next) => {
  console.log('[Post login]');
  const { email, password } = req.body;
  let loadedUser;
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        const error = new Error('A user with this email could not be found.');
        error.statusCode = 401;
        throw error;
      }
      loadedUser = user;
      const { password: hashedPassword } = user;
      return bcrypt.compare(password, hashedPassword);
    })
    .then((isMatch) => {
      if (!isMatch) {
        const error = new Error('Wrong password!');
        error.statusCode = 401;
        throw error;
      }
      const token = jwt.sign(
        {
          email: loadedUser.email,
          userId: loadedUser._id.toString(),
        },
        'my_secret_key',
        { expiresIn: '1h' }
      );
      res.status(200).json({
        message: 'Post login successfully!',
        userId: loadedUser._id.toString(),
        token,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getStatus = (req, res, next) => {
  console.log('[Get status]');
  const userId = req.userId;

  User.findById(userId)
    .then((user) => {
      if (!user) {
        const error = new Error('User not found.');
        error.statusCode = 401;
        throw error;
      }
      res.status(200).json({
        message: 'Get status successfully',
        status: user.status,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.updateStatus = (req, res, next) => {
  console.log('[Update status]');
  const { status } = req.body;
  const userId = req.userId;

  User.findById(userId)
    .then((user) => {
      if (!user) {
        const error = new Error('User not found.');
        error.statusCode = 401;
        throw error;
      }

      user.status = status;

      return user.save();
    })
    .then((result) => {
      res.status(200).json({
        message: 'Updated status successfully',
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

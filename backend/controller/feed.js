const fs = require('fs');
const path = require('path');

const { validationResult } = require('express-validator');

const Post = require('../models/post');
const User = require('../models/user');

const POST_PER_PAGE = 2;

exports.getPosts = async (req, res, next) => {
  console.log('[Get Posts]');
  const currentPage = parseInt(req.query.page) || 1;

  try {
    const totalItems = await Post.find().countDocuments();
    const posts = await Post.find()
      .populate('creator')
      .skip((currentPage - 1) * POST_PER_PAGE)
      .limit(POST_PER_PAGE);

    res.status(200).json({
      message: 'Fetched Posts successfully!',
      posts,
      totalItems,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getPost = async (req, res, next) => {
  console.log('[Get Post]');
  const { postId } = req.params;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error('Could not find post.');
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({
      message: 'Fetched Post successfully!',
      post,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.createPost = async (req, res, next) => {
  console.log('[Post Post]');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.');
    error.statusCode = 422;
    throw error;
  }
  if (!req.file) {
    const error = new Error('No image provided.');
    error.statusCode = 422;
    throw error;
  }
  const { title, content } = req.body;
  const imageUrl = req.file.path;
  const post = new Post({
    title: title,
    content: content,
    imageUrl: imageUrl,
    creator: req.userId,
  });

  try {
    const user = await User.findById(req.userId);
    user.posts.push(post);
    const result = await user.save();
    res.status(201).json({
      message: 'Post created successfully!',
      post: post,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updatePost = async (req, res, next) => {
  console.log('[Put Post]');
  const { postId } = req.params;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.');
    error.statusCode = 422;
    throw error;
  }

  const { title, content } = req.body;
  let imageUrl = req.body.image;

  if (req.file) {
    imageUrl = req.file.path;
  }
  if (!imageUrl) {
    const error = new Error('No file picked.');
    error.statusCode = 422;
    throw error;
  }

  try {
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error('Could not find post.');
      error.statusCode = 404;
      throw error;
    }
    if (post.creator.toString() !== req.userId) {
      const error = new Error('No authorized!');
      error.statusCode = 403;
      throw error;
    }
    if (imageUrl !== post.imageUrl) {
      clearImage(post.imageUrl);
    }

    post.title = title;
    post.imageUrl = imageUrl;
    post.content = content;

    const result = await post.save();

    res.status(200).json({
      message: 'Post updated successfully!',
      post: result,
    });

  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.deletePost = (req, res, next) => {
  console.log('[Delete Post]');
  const { postId } = req.params;

  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error('Could not find post.');
        error.statusCode = 404;
        throw error;
      }
      if (post.creator.toString() !== req.userId) {
        const error = new Error('No authorized!');
        error.statusCode = 403;
        throw error;
      }
      clearImage(post.imageUrl);

      return Post.findByIdAndDelete(postId);
    })
    .then((result) => {
      return User.findById(req.userId);
    })
    .then((user) => {
      user.posts.pull(postId);
      return user.save();
    })
    .then(() => {
      res.status(200).json({
        message: 'Post deleted successfully!',
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

const clearImage = (imagePath) => {
  imagePath = path.join(__dirname, '..', imagePath);
  fs.unlink(imagePath, (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });
};

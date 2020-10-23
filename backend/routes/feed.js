const express = require('express');
const { body } = require('express-validator');

const FeedContorller = require('../controller/feed');
const isAuth = require('../middleware/isAuth');

const router = express.Router();
// GET /feed/posts
router.get('/posts', isAuth, FeedContorller.getPosts);
// GET /feed/posts/:postId
router.get('/post/:postId', isAuth, FeedContorller.getPost);
// POST /feed/post
router.post(
  '/post',
  isAuth,
  [
    body('title').trim().isLength({ min: 5 }),
    body('content').trim().isLength({ min: 5 }),
  ],
  FeedContorller.createPost
);
// PUT /feed/post/:postId
router.put(
  '/post/:postId',
  isAuth,
  [
    body('title').trim().isLength({ min: 5 }),
    body('content').trim().isLength({ min: 5 }),
  ],
  FeedContorller.updatePost
);
// DELETE /feed/post/:postId
router.delete('/post/:postId', isAuth, FeedContorller.deletePost);

module.exports = router;

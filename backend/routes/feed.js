const express = require('express');

const FeedContorller = require('../controller/feed');

const router = express.Router();
// GET /feed/posts
router.get('/posts', FeedContorller.getPosts);
// GET /feed/post
router.get('/posts/:id', FeedContorller.getPost);
// POST /feed/post
router.post('/post', FeedContorller.createPost);

module.exports = router;

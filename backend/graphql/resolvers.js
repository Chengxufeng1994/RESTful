const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');

const Post = require('../models/post');
const User = require('../models/user');

const { clearImage } = require('../utils/index');

const saltRounds = 12;

const resolvers = {
  createUser: async (args, ctx, info) => {
    const { userInput } = args;
    const { name, email, password } = userInput;
    const errors = [];

    if (!validator.isEmail(email)) {
      errors.push({ message: 'E-Mail is invalid.' });
    }

    if (
      validator.isEmpty(password) ||
      !validator.isLength(password, { min: 5 })
    ) {
      errors.push({ message: 'Password too short' });
    }

    if (errors.length > 0) {
      const error = new Error('Invalid input');
      error.code = 422;
      error.data = errors;
      throw error;
    }

    const existingUser = await User.findOne({ email: email });

    if (existingUser) {
      const error = new Error('User exists already!');
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = new User({
      name: name,
      email: email,
      password: hashedPassword,
      posts: [],
    });

    const createdUser = await user.save();

    return { ...createdUser._doc, _id: createdUser._id.toString() };
  },

  login: async (args, ctx, info) => {
    const { loginInput } = args;
    const { email, password } = loginInput;

    const user = await User.findOne({ email: email });
    if (!user) {
      const error = new Error('A user with this email could not be found.');
      error.code = 401;
      throw error;
    }

    const { password: hashedPassword } = user;
    const isMatch = await bcrypt.compare(password, hashedPassword);
    if (!isMatch) {
      const error = new Error('Wrong password');
      error.code = 422;
      throw error;
    }

    const token = jwt.sign(
      {
        email: user.email,
        userId: user._id.toString(),
      },
      'my_secret_key',
      { expiresIn: '1h' }
    );

    return { userId: user._id.toString(), token };
  },

  createPost: async (args, ctx, info) => {
    if (!ctx.isAuth) {
      const error = new Error('Not authenticated!');
      error.code = 401;
      throw error;
    }
    const { postInput } = args;
    const { title, imageUrl, content } = postInput;
    const errors = [];

    if (validator.isEmpty(title) || !validator.isLength(title, { min: 5 })) {
      errors.push({ message: 'Title too short' });
    }
    if (
      validator.isEmpty(content) ||
      !validator.isLength(content, { min: 5 })
    ) {
      errors.push({ message: 'Content too short' });
    }
    if (!imageUrl) {
      errors.push({ message: 'No image provided.' });
    }
    if (errors.length > 0) {
      const error = new Error('Invalid Input');
      error.code = 422;
      error.data = errors;
      throw error;
    }
    const user = await User.findById(ctx.userId);
    if (!user) {
      const error = new Error('Invalid User.');
      error.code = 401;
      throw error;
    }

    const post = new Post({
      title: title,
      imageUrl: imageUrl,
      content: content,
      creator: user,
    });

    const createdPost = await post.save();
    // Add new post to user's posts;
    user.posts.push(createdPost);
    await user.save();

    return {
      ...createdPost._doc,
      _id: createdPost._id.toString(),
      createdAt: createdPost.createdAt,
      updatedAt: createdPost.updatedAt,
    };
  },

  updatePost: async (args, ctx) => {
    console.log(args);
    if (!ctx.isAuth) {
      const error = new Error('Not authenticated!');
      error.code = 401;
      throw error;
    }
    // Check post not find
    const { postInput, postId } = args;
    const { title, imageUrl, content } = postInput;
    const post = await Post.findById(postId).populate('creator');
    if (!post) {
      const error = new Error('Could not find post.');
      error.code = 404;
      throw error;
    }
    if (post.creator._id.toString() !== ctx.userId) {
      const error = new Error('No Authorized.');
      error.code = 403;
      throw error;
    }

    const errors = [];
    if (validator.isEmpty(title) || !validator.isLength(title, { min: 5 })) {
      errors.push({ message: 'Title too short' });
    }
    if (
      validator.isEmpty(content) ||
      !validator.isLength(content, { min: 5 })
    ) {
      errors.push({ message: 'Content too short' });
    }
    if (!imageUrl) {
      errors.push({ message: 'No image provided.' });
    }
    if (errors.length > 0) {
      const error = new Error('Invalid Input');
      error.code = 422;
      error.data = errors;
      throw error;
    }

    post.title = title;
    if (imageUrl !== 'undefined') {
      post.imageUrl = imageUrl;
    }
    post.content = content;

    const updatedPost = await post.save();
    // Add new post to user's posts;
    const user = await User.findById(ctx.userId);
    if (!user) {
      const error = new Error('Invalid User.');
      error.code = 401;
      throw error;
    }
    const updatedPostIndex = user.posts.findIndex(
      (p) => p._id.toString() === postId
    );
    user.posts[updatedPostIndex] = updatedPost;
    await user.save();

    return {
      ...updatedPost._doc,
      _id: updatedPost._id.toString(),
      createdAt: updatedPost.createdAt,
      updatedAt: updatedPost.updatedAt,
    };
  },

  deletePost: async (args, ctx, info) => {
    console.log('[Delete posts]');
    const { postId } = args;
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error('Could not find post.');
      error.code = 404;
      throw error;
    }
    if (post.creator._id.toString() !== ctx.userId) {
      const error = new Error('No Authorized.');
      error.code = 403;
      throw error;
    }

    clearImage(post.imageUrl);
    await Post.findByIdAndDelete(postId);
    const user = await User.findById(ctx.userId);
    user.posts.pull(postId);
    await user.save();

    return true;
  },

  fetchPosts: async (args, ctx, info) => {
    console.log('[Fetch posts]');
    if (!ctx.isAuth) {
      const error = new Error('Not authenticated!');
      error.code = 422;
      throw error;
    }
    const { page } = args;
    const POST_PER_PAGE = 2;
    if (!page) {
      page = 1;
    }
    const posts = await Post.find()
      .populate('creator')
      .sort({ createdAt: -1 })
      .skip((page - 1) * POST_PER_PAGE)
      .limit(POST_PER_PAGE);
    const totalPosts = await Post.find().countDocuments();
    const formatedPosts = posts.map((post) => {
      return {
        ...post._doc,
        _id: post._id.toString(),
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      };
    });

    return {
      posts: formatedPosts,
      totalPosts,
    };
  },

  fetchPost: async (args, ctx, info) => {
    console.log('[Fetch Post]');
    if (!ctx.isAuth) {
      const error = new Error('Not authenticated!');
      error.code = 422;
      throw error;
    }
    const { postId } = args;
    const post = await Post.findById(postId).populate('creator');
    if (!post) {
      const error = new Error('Could not find post.');
      error.code = 404;
      throw error;
    }

    return {
      ...post._doc,
      _id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  },

  fetchUser: async (args, ctx, info) => {
    console.log('[Fetch User Status]');
    if (!ctx.isAuth) {
      const error = new Error('Not authenticated!');
      error.code = 422;
      throw error;
    }
    const user = await User.findById(ctx.userId);
    if (!user) {
      const error = new Error('Invalid User.');
      error.code = 401;
      throw error;
    }

    return { ...user._doc, _id: user._id.toString };
  },

  updateUserStatus: async (args, ctx, info) => {
    console.log('[Update User Status]');
    if (!ctx.isAuth) {
      const error = new Error('Not authenticated!');
      error.code = 422;
      throw error;
    }
    const user = await User.findById(ctx.userId);
    if (!user) {
      const error = new Error('Invalid User.');
      error.code = 401;
      throw error;
    }

    const { statusInput } = args;
    const { status } = statusInput;
    user.status = status;
    await user.save();

    return { status: user.status };
  },
};

module.exports = resolvers;

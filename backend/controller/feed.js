exports.getPosts = (req, res, next) => {
  console.log('[Get Posts]');

  res.status(200).json({
    posts: [
      { title: 'First Post', content: 'This is the first post!' },
      { title: 'Second Post', content: 'This is the second post!' },
    ],
  });
};

exports.getPost = (req, res, next) => {
  console.log('[Get Post]');
  res.send('[Get Post]');
};

exports.createPost = (req, res, next) => {
  console.log('[Post Post]');
  const { title, content } = req.body;
  console.log(title, content);

  res.status(201).json({
    message: 'Post created successfully!',
    post: { id: new Date().toISOString(), title: title, content: content },
  });
};

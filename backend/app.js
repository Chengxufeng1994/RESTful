const fs = require('fs');
const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const{ graphqlHTTP } = require('express-graphql');

const schema = require('./graphql/schema');
const resolvers = require('./graphql/resolvers');
// middleware
const isAuth = require('./middleware/isAuth');
// utils
const { clearImage } = require('./utils/index')

const app = express();

const localhost = '127.0.0.1';
const PORT = process.env.PORT || 3000;
const URI = 'mongodb+srv://Benny:Lxhtmj490i2fFNXh@cluster0.fyfno.mongodb.net/messages';
const fileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'images');
  },
  filename: function (req, file, cb) {
    // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, new Date().toISOString() + '-' + file.originalname);
  }
})
const fileFilter = function (req, file, cb) {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
const fileUpload = multer({ storage: fileStorage, fileFilter: fileFilter }).single('image');
// app.use(bodyParser.urlencoded({ extended: false }));  // x-www-form-urlencoded <form>
app.use(bodyParser.json()); // application/json
app.use(cors());
// express/multer
app.use(fileUpload);
// 在 Express 中提供靜態檔案，指定路徑/images
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods','OPTIONS, GET, POST, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.statusCode(200);
  }
  next();
});
app.use(isAuth);
app.put('/post-image',(req, res, next) => {
  console.log('[PUT /post-image]')
  if(!req.isAuth) {
    throw new Error('No authenticated!')
  }
  if(!req.file) {
    return res.status(200).json({ message: "No file provided!" });
  }
  if (req.body.oldPath) {
    clearImage(req.body.oldPath);
  }
  return res.status(200).json({ message: "File storged", filePath: req.file.path });
});
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: resolvers,
  graphiql: true,
  customFormatErrorFn: (error) => {
    if(!error.originalError) {
      return error;
    }

    const code = error.originalError.code || 500;
    const data = error.originalError.data;
    const message = error.message || 'An error occurred';

    return {
      status: code,
      data: data, 
      message: message,
    }
  }
}));
// Error Handling
app.use((error, req, res, next) => {
  console.log('[Error Handling]', error);
  const statusCode = error.statusCode || 500;
  const message = error.message;
  const data = error.data;

  res.status(statusCode).json({
    message:  message,
    data: data
  })
});
// connect to MongoDB
mongoose.connect(URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((response) => {
    app.listen(PORT, localhost, function () {
      console.log(`Server running at http://127.0.0.1:${PORT}/`);
    });
  })
  .catch((error) => {
    console.log(error.message);
  });
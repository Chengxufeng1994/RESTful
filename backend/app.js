const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const { uuidv4 } = require('uuid');

const FeedRoutes = require('./routes/feed');
const AuthRoutes = require('./routes/auth');
const socket = require('./socket');

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
// express/multer
app.use(fileUpload);
// 在 Express 中提供靜態檔案，指定路徑/images
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods','GET, POST, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});
app.use('/feed', FeedRoutes);
app.use('/auth', AuthRoutes);
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
    const server = app.listen(PORT, localhost, function () {
      console.log(`Server running at http://127.0.0.1:${PORT}/`);
    });
    const io = require('./socket').init(server);

    io.on('connection', (socket) => {
      console.log('Client connected');
    });
  })
  .catch((error) => {
    console.log(error.message);
  });

const express = require('express');
const bodyParser = require('body-parser');

const FeedRoutes = require('./routes/feed');

const app = express();

const localhost = '127.0.0.1';
const PORT = process.env.PORT || 3000;

// app.use(bodyParser.urlencoded({ extended: false }));  // x-www-form-urlencoded <form>
app.use(bodyParser.json()); // application/json
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods','GET, POST, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});
app.use('/feed', FeedRoutes);

app.listen(PORT, localhost, function () {
  console.log(`Server running at http://127.0.0.1:${PORT}/`);
});

const fs = require('fs');
const path = require('path');

const clearImage = (imagePath) => {
  imagePath = path.join(__dirname, '..', imagePath);
  fs.unlink(imagePath, (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });
};

exports.clearImage = clearImage;

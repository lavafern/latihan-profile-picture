const multer = require('multer');

function multerFilter(extFilters) {
    return multer({
        fileFilter : (req, file, callback) => {
          const allowedMimeTypes =extFilters;
    
          if (!allowedMimeTypes.includes(file.mimetype)) {
              const err = new Error(`Only ${allowedMimeTypes.join(', ')} allowed to upload!`);
              return callback(err, false);
          }
          callback(null, true);
      },
        onError: (err, next) => {
          console.log('error',err);
          next(err);
      }
      })
    
}


module.exports = {
    image : multerFilter(['image/png', 'image/jpeg'])
}
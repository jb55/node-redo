
var crypto = require('crypto');
var fs = require('fs');
var once = require('once');

/**
 * Get an md5 hash of a file
 *
 * @param {Function} fn
 * @api public
 */
exports.md5 = function(path, cb) {
  var hash = crypto.createHash('md5');
  var s = fs.createReadStream(path);
  cb = once(cb);

  s.on('data', function(d) {
    hash.update(d);
  });

  s.on('end', function() {
    var d = hash.digest('hex');
    cb(null, d);
  });

  s.on('error', function(err) {
    cb(err);
  });
};


/**
 * Get the mtime of a file
 *
 * @param {Function} fn
 * @api public
 */
exports.mtime = function(path, cb) {
  fs.stat(path, function(err, data){
    return cb(err, data.mtime);
  });
};

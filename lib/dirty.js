
var fs = require('fs');
var db = require('./db');
var lazy = require('lazy-string');
var path = require('path');
var util = require('./util');
var debug = require('debug')('redo:dirty');

/**
 * callback (err, bool) if target is dirty
 *
 * @param {String} A target
 * @api public
 */
exports = module.exports = function dirty (target, cb) {
  db.meta(target, function (err, meta){
    exports.mtime(meta, target, function (err, dirty) {
      if (err) return err;
      if (dirty) return cb(null, dirty);

      exports.md5(meta, target, cb);
    });
  });
};

/**
 * callback (err, bool) if target is dirty
 * based on its modified time
 *
 * @param {Function} fn
 * @api public
 */
exports.mtime = function (meta, target, cb) {
  util.mtime(target, function (err, mtime) {
    var dirty = meta.mtime.getTime() !== mtime.getTime();
    logdirty(target, dirty, "mtime", meta.mtime.getTime(), mtime.getTime());
    cb(null, dirty);
  });
};


/**
 * callback (err, bool) if a target is dirty
 * based on its md5 signature
 *
 * @param {Function} fn
 * @api public
 */
exports.md5 = function (meta, target, cb) {
  util.md5(target, function (err, hash) {
    var dirty = meta.hash !== hash ;
    logdirty(target, dirty, "md5", meta.hash, hash);
    return cb(err, dirty);
  });
};


// logging util
function logdirty(target, dirty, type, before, after){
  debug(lazy(function(){
    var p = path.basename(target);
    return p + " " + type + " dirty? " + dirty + "\n\t\t" +
      before + " -> " + after;
  }));
}


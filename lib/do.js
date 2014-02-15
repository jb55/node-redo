
var parents = require('parents');
var takeUntil = require('take-until');
var path = require('path');
var fs = require('fs');
var async = require('async');
var assert = require('assert');
var db = require('./db');
var debug = require('debug')('redo:do');

var _do = module.exports;

_do.file = function(target) {
  var ext = path.extname(target);
  return "default" + ext + ".do";
};

_do.path = function(target) {
  var file = _do.file(target);
  var dir = path.dirname(target);
  return path.join(dir, file);
};


/**
 * Strip dbparent from path
 *
 * @param {target} target
 * @param {string} dbparent path
 * @api public
 */
_do.strip = function(target, dbparent) {
  var stripped = target.replace(dbparent, "").replace(/^\//, "");
  debug("stripped: %s", stripped);
  return stripped;
};

/**
 * Only get parents up to dbroot
 *
 * @param {target} target
 * @param {string} dbroot path
 * @api public
 */
_do.parents = function(target, dbparent) {
  var rents = parents(target);
  rents.shift();
  rents = takeUntil(rents, function(rent){
    return rent === dbparent;
  });
  debug("parents: %s", rents);
  return rents;
};

/**
 * Find do files for a target
 *
 * @param {target}
 * @param {callback}
 * @api public
 */
_do.find = function(target, cb) {
  var found = null;

  db.findp(target, function (err, paths){
    if (err) return cb(err);
    var rents = _do.parents(target, paths.dbparent);
    var def = _do.file(target);

    function exists(dir, cb){
      var p = path.join(dir, def);
      fs.exists(p, function(exists){
        debug('check existence of %s: %s', p, exists);
        if (exists) found = p;
        return cb(exists);
      });
    }

    var first = target + ".do";
    fs.exists(first, function(e){
      debug('check existence of %s: %s', first, e);
      if (e) cb(null, first);

      // PROFILEME
      //
      // this doesn't short circuit, this could be bad for
      // large paths. async.detectSerial if this is an issue.
      // 
      async.some(rents, exists, function(result){
        return cb(null, found);
      });
    });
  });
};

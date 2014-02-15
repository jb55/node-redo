
var path = require('path');
var mkdirp = require('mkdirp');
var util = require('./util');
var async = require('async');
var fs = require('fs');
var parents = require('parents');
var debug = require('debug')('redo:db');
var join = path.join;

/**
 * cache stuff
 */
var cachelog = require('debug')('redo:cache');
var cache = exports.cache = {};
cache.located = {};
cache.paths = {};

// db folder name
exports.dbname = ".nredo";

/**
 * Find an `.nredo` db in current and all
 * parent directories of target
 *
 * @param {Target} target to search from
 * @param {Callback} (err, dir)
 * @api public
 */
exports.find = function(target, cb) {
  var hit = cache.located[target];
  if (hit) cachelog("HIT find dbpath " + target);
  else cachelog("MISS find dbpath " + target);
  if (hit) return cb(null, hit);

  var dirs = parents(target);
  var dbpath = null;

  function exists(dir, done) {
    dir = join(dir, exports.dbname);
    fs.exists(dir, function(exists){
      if (exists === true) dbpath = dir;
      return done(exists);
    });
  }

  async.some(dirs, exists, function (){
    if (dbpath) cache.located[target] = dbpath;
    return cb(null, dbpath);
  });
};


/**
 * Load a targets db data
 *
 * @param {Target} target
 * @param {Callback} (err, obj)
 * @api public
 */
exports.load = function(target, cb) {
  exports.find(target, function(err, dbpath){
    if (dbpath === null) {
      dbpath = path.join(path.dirname(target), exports.dbname);
      cache.located[target] = dbpath;
    }
    var paths = exports.paths(dbpath, target);
    debug("making '" + paths.dbdir + "' directory");

    mkdirp(paths.dbdir, function (err){
      if (err) return cb (err);

      fs.exists(paths.dbtarget, function (exists) {
        if (!exists) return cb(null, {});
        var json = require(paths.dbtarget);
        return cb(null, json);
      });
    });
  });
};


/**
 * Get paths related to a target.
 *
 * @param {Target} target
 * @param {Callback} (err, obj)
 * obj:
 *   dbpath =      /tmp/project/.nredo
 *   target =      /tmp/project/src/foo.c
 *
 *   { targetname: foo.c
 *   , targetdir:  /tmp/project/src
 *   , dbroot:     /tmp/project
 *   , dbreldir:   src
 *   , dbrel:      src/foo.c
 *   , dbdir:      /tmp/project/.nredo/src
 *   , dbtarget:   /tmp/project/.nredo/src/foo.c.json
 *   }
 */
exports.paths = function(dbpath, target) {
  var pathkey = dbpath + target;
  var hit = cache.paths[pathkey];
  if (hit) cachelog("HIT path " + target);
  else cachelog("MISS path " + target);
  if (hit) return hit;

  var targetdir = path.dirname(target);
  var targetname = path.basename(target);
  var dbroot = path.dirname(dbpath);
  var dbparent = path.dirname(dbroot);
  var dbreldir = targetdir.replace(new RegExp("^" + dbroot + "\/?"), "");
  var dbrel = join(dbreldir, targetname);
  var dbdir = join(dbpath, dbreldir);
  var dbtarget = join(dbdir, targetname + ".json");

  var paths = {
    targetname: targetname,
    target: target,
    targetdir: targetdir,
    dbpath: dbpath,
    dbparent: dbparent,
    dbroot: dbroot,
    dbreldir: dbreldir,
    dbrel: dbrel,
    dbdir: dbdir,
    dbtarget: dbtarget
  };

  cache.paths[pathkey] = paths;
  return paths;
};

exports.meta = function(target, cb) {
  exports.load(target, function (err, data){
    if (err) return err;
    data.mtime = new Date(data.mtime);
    return cb(err, data);
  });
};

/**
 * Write metadata to a dbtarget
 *
 * @param {string} dbtarget
 * @param {json} json string
 * @api public
 */
exports.meta.write = function(target, data, cb) {
  exports.find(target, function (err, dbpath){
    var paths = exports.paths(dbpath, target);
    fs.writeFile(paths.dbtarget, data, cb);
  });
};


/**
 * Initial file metadata
 *
 * @param {Function} fn
 * @api public
 */
exports.meta.init = function(target, cb) {
  function done(err, results) {
    if (err) return cb(err);

    var paths = results[0];
    var data = {
      hash: results[1],
      mtime: results[2]
    };

    debug("writing " + paths.dbtarget);
    fs.writeFile(paths.dbtarget, JSON.stringify(data), function (err){
      if (err) return cb(err, data);
      return cb(null, data);
    });
  }

  async.series([
    exports.findp.bind(null, target),
    util.md5.bind(null, target),
    util.mtime.bind(null, target)
  ], done);
};

/**
 * Find paths for a target
 *
 * @param {target} target
 * @param {callback} (err, target paths)
 * @api public
 */
exports.findp = function(target, cb) {
  exports.find(target, function (err, dbpath){
    var paths = exports.paths(dbpath, target);
    return cb(err, paths);
  });
};

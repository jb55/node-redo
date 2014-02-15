
var _do = require('../lib/do');
var db = require('../lib/db');
var fs = require('fs');
var mkdirp = require('mkdirp').sync;
var path = require('path');
var should = require('should');
var rimraf = require('rimraf').sync;
var debug = require('debug')('redo:test:do');

var join = path.join;
var create = fs.writeFileSync;

var root = "/tmp/node-redo-tests/do";
var subdir = path.join(root, "1")
var target = path.join(subdir, "target.txt");

rimraf(root);

describe("do file detection", function(){
  var state = {};

  before(function(done){
    db.load(join(root, "hi.txt"), function(){
      db.findp(target, function(err, paths){
        state.paths = paths;
        done();
      });
    });
  });

  it('strip works', function(){
    var paths = state.paths;
    debug("paths %j", paths);
    paths.dbparent.should.not.equal(".");
    should.exist(paths);
    var stripped = _do.strip(target, paths.dbparent);
  });

  it('parents are correct', function(){
    var paths = state.paths;
    var rents = _do.parents(target, paths.dbparent);
    rents.should.not.containEql(target);
    rents.should.containEql(root);
    rents.should.not.containEql("/tmp/node-redo-tests");
  });

  // strip test: would the result of strip ever need to start with '/' ?

  it('file path is correct', function(){
    _do.file(target).should.equal("default.txt.do");
  });

  it('full path is correct', function() {
    _do.path(target).should.equal(join(subdir, "default.txt.do"));
  });

  it('files are found', function(done) {
    mkdirp(subdir);
    create(join(root, "default.txt.do"), "");
    _do.find(target, function(err, p){
      should.not.exist(err);
      should.exist(p);
      p.should.equal("/tmp/node-redo-tests/do/default.txt.do");
      done();
    });
  });
});


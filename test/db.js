
var join = require('path').join;
var fs = require('fs');
var db = require('../lib/db');
var dirty = require('../lib/dirty');
var debug = require('debug')('redo:test');
var should = require('should');
var rimraf = require('rimraf').sync;

var root = '/tmp/node-redo-tests';
rimraf(root);

var target = join(root, "src/derp.txt");

describe('db creation', function() {
  var state = {};

  it('creates ' + db.dbname + ' properly', function(done) {
    db.load(target, function (err) {
      should.not.exist(err);
      var p = join(root, "src", db.dbname);
      debug('checking existence of ' + p);
      fs.existsSync(p).should.be.true;
      done();
    });
  });

  it('find locates .nredo properly', function(done){
    db.find(target, function (err, dbpath){
      should.not.exist(err);
      should.exist(dbpath);
      debug("found .nredo at " + dbpath);
      state.dbpath = dbpath;
      state.paths = db.paths(dbpath, target);
      done();
    });
  });

  it('dbdir found in located .nredo path', function(){
    var dbdir = state.paths.dbdir;
    fs.existsSync(dbdir).should.be.true;
    debug("found dbdir " + dbdir);
  });

  it('find nothing in /usr/local/bin', function(done){
    db.find('/usr/local/bin', function (err, dbpath){
      should.not.exist(err);
      should.not.exist(dbpath);
      done();
    });
  });


});


describe('metadata', function(){
  it('writing initial works', function(done){
    fs.writeFileSync(target, "");

    debug("writing metadata for %s", target);
    db.meta.init(target, function (err, data){
      should.not.exist(err);
      should.exist(data);
      should(data).have.property('mtime');
      should(data).have.property('hash');

      debug("init data %j", data);

      should.exist(data.mtime);
      should.exist(data.hash);

      db.findp(target, function (err, paths){
        fs.existsSync(paths.dbtarget).should.be.true;
        done();
      });
    });
  });

  it('reading works', function(done){
    db.meta(target, function (err, data){
      should.not.exist(err);
      should.exist(data);
      should(data).have.property('mtime');
      should(data).have.property('hash');
      should.exist(data.mtime);
      should.exist(data.hash);
      done();
    });
  });

  describe('dirty', function() {
    it('shouldnt be dirty yet', function(done){
      dirty(target, function(err, dirt){
        should.not.exist(err);
        dirt.should.be.false;
        done();
      });
    });

    it('should be dirty now', function(done){
      fs.writeFileSync(target, "hello");
      dirty(target, function(err, dirt){
        should.not.exist(err);
        dirt.should.be.true;
        done();
      });
    });
  });
});

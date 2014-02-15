var join = require('path').join;
var db = require('../lib/db');

describe('db paths', function() {
  var root = "/tmp/project";
  var dbpath = join(root, db.dbname);

  it('are correct with no subdirs', function() {
    var target = join(root, "foo.c");
    var paths = db.paths(dbpath, target);
    paths.targetname.should.equal("foo.c");
    paths.targetdir.should.equal(root);
    paths.dbroot.should.equal(root);
    paths.dbparent.should.equal("/tmp");
    paths.dbreldir.should.equal("");
    paths.dbrel.should.equal("foo.c");
    paths.dbdir.should.equal(join(root, db.dbname));
    paths.dbtarget.should.equal(join(root, db.dbname, "foo.c.json"));
  });

  it('are correct with one subdir', function() {
    var target = join(root, "src/foo.c");
    var paths = db.paths(dbpath, target);

    paths.targetname.should.equal("foo.c");
    paths.targetdir.should.equal(join(root, "src"));
    paths.dbroot.should.equal(root);
    paths.dbreldir.should.equal("src");
    paths.dbparent.should.equal("/tmp");
    paths.dbrel.should.equal("src/foo.c");
    paths.dbdir.should.equal(join(root, db.dbname, "src"));
    paths.dbtarget.should.equal(join(root, db.dbname, "src/foo.c.json"));
  });
});

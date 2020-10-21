const DB       = require('lib');
const AWS      = require('aws-sdk');
const async    = require('async');
const chai     = require('chai');
const expect   = chai.expect;
const assert   = chai.assert;
const sinon    = require("sinon");
const _        = require("lodash");

describe('Table: integration', function() {

    this.timeout(180000);

    let awsConfig = {
        region   : 'us-west-2'

    };
    let joi = DB.joi;
    let Schema = DB.schema(awsConfig);
    let Table = DB.table;
    let PromisifiedTable = DB.PromisifiedTable;
    let Item = DB.item;
    let db;
    let tableName  = process.env.ENV_NAME + '-dynamodb-wrapper-test-table' + Math.round(Math.random() * 100000);
    let tableSchema;
    let testTable;
    let TestTableItem;
    let sandbox;
    let putSpy;
    let updateSpy;
    let getSpy;
    let deleteSpy;
    let querySpy;
    let scanSpy;
    let afterUpdate;

    before((done) => {
        console.log('Creating test table...');
        async.series([
            (next) => {
                db = new AWS.DynamoDB(awsConfig);
                next();
            },
            (next) => {
                //create test table
                db.createTable({
                    TableName: tableName,
                    AttributeDefinitions: [{
                        AttributeName: 'hashKey',
                        AttributeType: 'S'
                    },{
                        AttributeName: 'rangeKey',
                        AttributeType: 'S'
                    }],
                    KeySchema: [{
                        AttributeName: 'hashKey',
                        KeyType: 'HASH'
                    },{
                        AttributeName: 'rangeKey',
                        KeyType: 'RANGE'
                    }],
                    ProvisionedThroughput: {
                        ReadCapacityUnits: 10,
                        WriteCapacityUnits: 10
                    }
                }, next);
            },
            (next) => {
                db.waitFor('tableExists', {TableName: tableName}, next);
            }
        ], done);
    });

    after((done) => {
        console.log('Deleting test table...');
        async.series([
            (next) => {
                db.deleteTable({
                    TableName: tableName
                }, next);
            },
            (next) => {
                db.waitFor('tableNotExists', {TableName: tableName}, next);
            }
        ], done);
    });

    beforeEach(function() {
        afterUpdate = 0;
        sandbox = sinon.createSandbox();
        tableSchema = new Schema({
            tableName: tableName,
            key: {
                hash: 'hashKey',
                range: 'rangeKey'
            },
            schema: {
                hashKey : joi.string().required(),
                rangeKey : joi.string().optional(),
                personalInformation : joi.object().keys({
                    firstName : joi.string().encrypt(),
                    lastName  : joi.string().encrypt(),
                    "0-0"     : joi.optional(),
                    "."     : joi.optional()
                }),
                zzzz: joi.number(),
                foo    : joi.string().required(),
                arr: joi.array()
            }
        });
        class TableItem extends Item {
            constructor(json) {
                super({
                    attrs: json,
                    schema: tableSchema
                });
            }
            getFoo(foo) {
                return 'Hello, ' + "foo" + '!';
            }
            extensionWorks() {
                return true;
            }
        }
        TestTableItem = TableItem;
        testTable = new Table({
            schema          : tableSchema,
            itemConstructor : TableItem
        });
        putSpy = sandbox.spy(tableSchema.db, "put");
        deleteSpy = sandbox.spy(tableSchema.db, "delete");
        querySpy = sandbox.spy(tableSchema.db, "query");
        scanSpy = sandbox.spy(tableSchema.db, "scan");
        getSpy = sandbox.spy(tableSchema.db, "get");
        updateSpy = sandbox.spy(tableSchema.db, "update");
        tableSchema.on("afterUpdate", function(data, callback) {
            afterUpdate++;
            return callback();
        });
    });

    afterEach(function() {
        sandbox.restore();
    });

    describe("Lock::", function() {
        it("Should be able to handle all types of errors", function(done) {
            var id = getUniqueId();
            let rec = new TestTableItem({
                hashKey  : id,
                rangeKey : {doesNotMatchSchema: true},
                foo : "abc",
                personalInformation: {
                    firstName: 'John'
                }
            });
            rec.acquireLock({
                ms: 1000
            }, (err, output) => {
                expect(output.lockAcquired).to.equal(false);
                assert(err, "Expect to receive an error");
                return done();
            });
        });
        it("Should not fire update hook for lock", function(done) {
            var id = getUniqueId();
            let rec = new TestTableItem({
                hashKey  : id,
                rangeKey : String(Math.round(Math.random() * 100000)),
                foo : "abc",
                personalInformation: {
                    firstName: 'John'
                }
            });
            rec.create((err) => {
                assert(!err, JSON.stringify(err));
                rec.acquireLock({
                    ms: 1000
                }, (err, output) => {
                    assert(!err, JSON.stringify(err));
                    expect(output.lockAcquired).to.equal(true);
                    expect(afterUpdate).to.equal(0);
                    return done();
                });
            });
        });
        it("Should fire update hook for update", function(done) {
            var id = getUniqueId();
            let rangeKey = String(Math.round(Math.random() * 100000));
            let rec = new TestTableItem({
                hashKey  : id,
                rangeKey,
                foo : "abc",
                personalInformation: {
                    firstName: 'John'
                }
            });
            rec.create((err) => {
                assert(!err, JSON.stringify(err));
                rec.set("foo", "bca");
                rec.update((err, output) => {
                    assert(!err, JSON.stringify(err));
                    testTable.get({
                        hashKey: id,
                        rangeKey
                    }, (err, item) => {
                        assert(!err, JSON.stringify(err));
                        expect(item.get("foo")).to.equal("bca");
                        expect(afterUpdate).to.equal(1);
                        return done();
                    });
                });
            });
        });
        describe("Realtime", function() {
            it("Failure", function(done) {
                var id = getUniqueId();
                let rec = new TestTableItem({
                    hashKey  : id,
                    rangeKey : String(Math.round(Math.random() * 100000)),
                    foo : "abc",
                    personalInformation: {
                        firstName: 'John'
                    }
                });
                rec.create((err) => {
                    assert(!err, JSON.stringify(err));
                    rec.acquireLock({
                        ms: 1000
                    }, (err, output) => {
                        assert(!err, JSON.stringify(err));
                        expect(output.lockAcquired).to.equal(true);
                        setTimeout(() => {
                            rec.acquireLock({
                                ms: 1000
                            }, (err, output) => {
                                assert(!err, JSON.stringify(err));
                                expect(output.lockAcquired).to.equal(false);
                                return done();
                            });
                        }, 50);
                    });
                });
            });
            it("Success", function(done) {
                var id = getUniqueId();
                let rec = new TestTableItem({
                    hashKey  : id,
                    rangeKey : String(Math.round(Math.random() * 100000)),
                    foo : "abc",
                    personalInformation: {
                        firstName: 'John'
                    }
                });
                rec.create((err) => {
                    assert(!err, JSON.stringify(err));
                    rec.acquireLock({
                        ms: 1000
                    }, (err, output) => {
                        assert(!err, JSON.stringify(err));
                        expect(output.lockAcquired).to.equal(true);
                        setTimeout(() => {
                            rec.acquireLock({
                                ms: 1000
                            }, (err, output) => {
                                assert(!err, JSON.stringify(err));
                                expect(output.lockAcquired).to.equal(true);
                                return done();
                            });
                        }, 1500);
                    });
                });
            });
        });
        it("Should be able to acquire a lock", function(done) {
            var id = getUniqueId();
            let rangeKey = String(Math.round(Math.random() * 100000));
            let rec = new TestTableItem({
                hashKey  : id,
                rangeKey,
                foo : "abc",
                personalInformation: {
                    firstName: 'John'
                }
            });
            let now = new Date("2019-04-12T04:00:00.000Z");
            rec.create((err) => {
                assert(!err, JSON.stringify(err));
                rec.acquireLock({
                    ms: 1000,
                    now
                }, (err, output) => {
                    assert(!err, JSON.stringify(err));
                    expect(output.lockAcquired).to.equal(true);
                    testTable.get({
                        hashKey: id,
                        rangeKey
                    }, (err, item) => {
                        assert(!err, JSON.stringify(err));
                        expect(item.get("internal_locks_replicate_to_rds")).to.equal("2019-04-12T04:00:01.000Z");
                        return done();
                    });
                });
            });
        });
        it("Lock should continue to allow updates", function(done) {
            var id = getUniqueId();
            let rangeKey = String(Math.round(Math.random() * 100000));
            let rec = new TestTableItem({
                hashKey  : id,
                rangeKey,
                foo : "abc",
                personalInformation: {
                    firstName: 'John'
                }
            });
            let now = new Date("2019-04-12T04:00:00.000Z");
            rec.create((err) => {
                assert(!err, JSON.stringify(err));
                rec.acquireLock({
                    ms: 1000,
                    now
                }, (err, output) => {
                    assert(!err, JSON.stringify(err));
                    expect(output.lockAcquired).to.equal(true);
                    rec.set("foo", "bca");
                    rec.update((err) => {
                        assert(!err, JSON.stringify(err));
                        testTable.get({
                            hashKey: id,
                            rangeKey,
                        }, (err, item) => {
                            assert(!err, JSON.stringify(err));
                            expect(item.get("foo")).to.equal("bca");
                            return done();
                        });
                    });
                });
            });
        });
        it("Should be able to gracefully fail to acquire a lock", function(done) {
            var id = getUniqueId();
            let rangeKey = String(Math.round(Math.random() * 100000));
            let rec = new TestTableItem({
                hashKey  : id,
                rangeKey,
                foo : "abc",
                personalInformation: {
                    firstName: 'John'
                }
            });
            let now = new Date("2019-04-12T04:00:00.000Z");
            let lockNotReleased = new Date("2019-04-12T04:00:01.000Z");
            rec.create((err) => {
                assert(!err, JSON.stringify(err));
                rec.acquireLock({
                    ms: 1000,
                    now
                }, (err, output) => {
                    assert(!err, JSON.stringify(err));
                    expect(output.lockAcquired).to.equal(true);
                    rec.acquireLock({
                        ms: 1000,
                        now: lockNotReleased
                    }, (err, output) => {
                        assert(!err, JSON.stringify(err));
                        expect(output.lockAcquired).to.equal(false);
                        return done();
                    });
                });
            });
        });
        it("Should be able to succesfully acquire a second lock", function(done) {
            var id = getUniqueId();
            let rec = new TestTableItem({
                hashKey  : id,
                rangeKey : String(Math.round(Math.random() * 100000)),
                foo : "abc",
                personalInformation: {
                    firstName: 'John'
                }
            });
            let now = new Date("2019-04-12T04:00:00.000Z");
            let lockReleased = new Date("2019-04-12T04:00:01.001Z");
            rec.create((err) => {
                assert(!err, JSON.stringify(err));
                rec.acquireLock({
                    ms: 1000,
                    now
                }, (err, output) => {
                    assert(!err, JSON.stringify(err));
                    expect(output.lockAcquired).to.equal(true);
                    rec.acquireLock({
                        ms: 1000,
                        now: lockReleased
                    }, (err, output) => {
                        assert(!err, JSON.stringify(err));
                        expect(output.lockAcquired).to.equal(true);
                        return done();
                    });
                });
            });
        });
        it("Should be able to fail to acquire a third lock", function(done) {
            var id = getUniqueId();
            let rec = new TestTableItem({
                hashKey  : id,
                rangeKey : String(Math.round(Math.random() * 100000)),
                foo : "abc",
                personalInformation: {
                    firstName: 'John'
                }
            });
            let now = new Date("2019-04-12T04:00:00.000Z");
            let lockOneReleased = new Date("2019-04-12T04:00:01.001Z");
            let lockTwoNotReleased = new Date("2019-04-12T04:00:02.001Z");
            rec.create((err) => {
                assert(!err, JSON.stringify(err));
                rec.acquireLock({
                    ms: 1000,
                    now
                }, (err, output) => {
                    assert(!err, JSON.stringify(err));
                    expect(output.lockAcquired).to.equal(true);
                    rec.acquireLock({
                        ms: 1000,
                        now: lockOneReleased
                    }, (err, output) => {
                        assert(!err, JSON.stringify(err));
                        expect(output.lockAcquired).to.equal(true);
                        rec.acquireLock({
                            ms: 1000,
                            now: lockTwoNotReleased
                        }, (err, output) => {
                            assert(!err, JSON.stringify(err));
                            expect(output.lockAcquired).to.equal(false);
                            return done();
                        });
                    });
                });
            });
        });
        it("Should be able to successfully acquire a third lock", function(done) {
            var id = getUniqueId();
            let rec = new TestTableItem({
                hashKey  : id,
                rangeKey : String(Math.round(Math.random() * 100000)),
                foo : "abc",
                personalInformation: {
                    firstName: 'John'
                }
            });
            let now = new Date("2019-04-12T04:00:00.000Z");
            let lockOneReleased = new Date("2019-04-12T04:00:01.001Z");
            let lockTwoReleased = new Date("2019-04-12T04:00:02.002Z");
            rec.create((err) => {
                assert(!err, JSON.stringify(err));
                rec.acquireLock({
                    ms: 1000,
                    now
                }, (err, output) => {
                    assert(!err, JSON.stringify(err));
                    expect(output.lockAcquired).to.equal(true);
                    rec.acquireLock({
                        ms: 1000,
                        now: lockOneReleased
                    }, (err, output) => {
                        assert(!err, JSON.stringify(err));
                        expect(output.lockAcquired).to.equal(true);
                        rec.acquireLock({
                            ms: 1000,
                            now: lockTwoReleased
                        }, (err, output) => {
                            assert(!err, JSON.stringify(err));
                            expect(output.lockAcquired).to.equal(true);
                            return done();
                        });
                    });
                });
            });
        });
    });

    describe("Create", function() {
        it('Working example', (done) => {
            var id = getUniqueId();
            let rec = new TestTableItem({
                hashKey  : id,
                rangeKey : "2",
                foo : "abc",
                personalInformation: {
                    firstName: 'John'
                }
            });
            rec.set("personalInformation.firstName", "Jeff");
            var uniqueReference = {a: true};
            rec.uniqueReference = uniqueReference;

            rec.create((err) => {
                assert(!err);
                expect(rec.get("hashKey")).to.equal(id);
                expect(putSpy.args[0][0].Item.hashKey).to.equal(id);
                expect(rec.get("personalInformation.firstName")).to.equal("Jeff");
                expect(putSpy.args[0][0].Item.personalInformation.firstName).to.equal("Jeff");
                expect(putSpy.args[0][0].TableName).to.equal(tableName);
                assert(rec.extensionWorks());
                expect(rec.uniqueReference).to.equal(uniqueReference);
                return done();
            });
        });
        it('timestamps', (done) => {
            var id = getUniqueId();
            tableSchema = new Schema({
                tableName: tableName,
                timestamps: true,
                key: {
                    hash: 'hashKey',
                    range: 'rangeKey'
                },
                schema: {
                    hashKey : joi.string().required(),
                    rangeKey : joi.string().optional(),
                    personalInformation : joi.object().keys({
                        firstName : joi.string().encrypt(),
                        lastName  : joi.string().encrypt(),
                        "0-0"     : joi.optional(),
                        "."     : joi.optional()
                    }),
                    zzzz: joi.number(),
                    foo    : joi.string().required(),
                    arr: joi.array()
                }
            });
            putSpy = sandbox.spy(tableSchema.db, "put");
            deleteSpy = sandbox.spy(tableSchema.db, "delete");
            querySpy = sandbox.spy(tableSchema.db, "query");
            scanSpy = sandbox.spy(tableSchema.db, "scan");
            getSpy = sandbox.spy(tableSchema.db, "get");
            updateSpy = sandbox.spy(tableSchema.db, "update");
            class TableItemTimestamps extends Item {
                constructor(json) {
                    super({
                        attrs: json,
                        schema: tableSchema
                    });
                }
                getFoo(foo) {
                    return 'Hello, ' + "foo" + '!';
                }
                extensionWorks() {
                    return true;
                }
            }
            testTable = new Table({
                schema          : tableSchema,
                itemConstructor : TableItemTimestamps
            });
            let rec = new TableItemTimestamps({
                hashKey  : id,
                rangeKey : "2",
                foo : "abc",
                personalInformation: {
                    firstName: 'John'
                }
            });
            rec.set("personalInformation.firstName", "Jeff");
            var uniqueReference = {a: true};
            rec.uniqueReference = uniqueReference;

            rec.create((err) => {
                assert(!err);
                expect(rec.get("hashKey")).to.equal(id);
                expect(putSpy.args[0][0].Item.hashKey).to.equal(id);
                expect(rec.get("personalInformation.firstName")).to.equal("Jeff");
                const fractionLength = _.last(rec.get("createdAt").split("\.")).length;
                expect(fractionLength).to.equal(3 + 1); // 3 milliseconds and a Z
                expect(putSpy.args[0][0].Item.personalInformation.firstName).to.equal("Jeff");
                expect(putSpy.args[0][0].TableName).to.equal(tableName);
                assert(rec.extensionWorks());
                expect(rec.uniqueReference).to.equal(uniqueReference);
                return done();
            });
        });
        it('timestamps extended', (done) => {
            var id = getUniqueId();
            tableSchema = new Schema({
                tableName: tableName,
                timestamps: "EXTENDED",
                key: {
                    hash: 'hashKey',
                    range: 'rangeKey'
                },
                schema: {
                    hashKey : joi.string().required(),
                    rangeKey : joi.string().optional(),
                    personalInformation : joi.object().keys({
                        firstName : joi.string().encrypt(),
                        lastName  : joi.string().encrypt(),
                        "0-0"     : joi.optional(),
                        "."     : joi.optional()
                    }),
                    zzzz: joi.number(),
                    foo    : joi.string().required(),
                    arr: joi.array()
                }
            });
            putSpy = sandbox.spy(tableSchema.db, "put");
            deleteSpy = sandbox.spy(tableSchema.db, "delete");
            querySpy = sandbox.spy(tableSchema.db, "query");
            scanSpy = sandbox.spy(tableSchema.db, "scan");
            getSpy = sandbox.spy(tableSchema.db, "get");
            updateSpy = sandbox.spy(tableSchema.db, "update");
            class TableItemTimestamps extends Item {
                constructor(json) {
                    super({
                        attrs: json,
                        schema: tableSchema
                    });
                }
                getFoo(foo) {
                    return 'Hello, ' + "foo" + '!';
                }
                extensionWorks() {
                    return true;
                }
            }
            testTable = new Table({
                schema          : tableSchema,
                itemConstructor : TableItemTimestamps
            });
            let rec = new TableItemTimestamps({
                hashKey  : id,
                rangeKey : "2",
                foo : "abc",
                personalInformation: {
                    firstName: 'John'
                }
            });
            rec.set("personalInformation.firstName", "Jeff");
            var uniqueReference = {a: true};
            rec.uniqueReference = uniqueReference;

            rec.create((err) => {
                assert(!err);
                expect(rec.get("hashKey")).to.equal(id);
                expect(putSpy.args[0][0].Item.hashKey).to.equal(id);
                expect(rec.get("personalInformation.firstName")).to.equal("Jeff");
                const fractionLength = _.last(rec.get("createdAt").split("\.")).length;
                expect(fractionLength).to.equal(3 + 3 + 3 + 1); // 3 milliseconds 3 microseconds 3 nanoseconds and a Z
                expect(putSpy.args[0][0].Item.personalInformation.firstName).to.equal("Jeff");
                expect(putSpy.args[0][0].TableName).to.equal(tableName);
                assert(rec.extensionWorks());
                expect(rec.uniqueReference).to.equal(uniqueReference);
                return done();
            });
        });
        it("Failure to validate", function(done) {
            var id = getUniqueId();
            let rec = new TestTableItem({
                INVALID_SCHEMA: true
            });

            rec.create((err) => {
                assert(err);
                assert(!putSpy.called);
                return done();
            });
        });
        it("No attributes", function(done) {
            let rec = new TestTableItem();

            rec.create((err) => {
                assert(err);
                assert(!putSpy.called);
                return done();
            });
        });
        it('Items JSON values are reset', (done) => {
            var id = getUniqueId();
            let rec = new TestTableItem({
                hashKey  : id,
                rangeKey : "2",
                foo : "abc",
                personalInformation: {
                    firstName: 'John'
                }
            });

            rec.create((err) => {
                assert(!err);
                expect(rec.get("foo")).to.equal("abc");
                return done();
            });
            rec.set("foo", "WILL_GET_OVERWRITTEN");
        });
    });

    describe("Update", function() {
        it('Working example', (done) => {
            var id = getUniqueId();
            let rec = new TestTableItem({
                hashKey  : id,
                rangeKey : "2",
                foo : "abc",
                personalInformation: {
                    firstName: 'John'
                }
            });

            var uniqueReference = {a: true};
            async.series([
                (next) => {
                    rec.create(next);
                },
                (next) => {
                    rec.set("personalInformation.firstName", "Jeff");
                    rec.uniqueReference = uniqueReference;
                    rec.update(next);
                },
                (next) => {
                    expect(rec.get("hashKey")).to.equal(id);
                    assert(updateSpy.args[0][0].UpdateExpression.length);
                    expect(rec.get("personalInformation.firstName")).to.equal("Jeff");
                    expect(Object.keys(updateSpy.args[0][0].ExpressionAttributeValues).length);
                    expect(updateSpy.args[0][0].Key.hashKey).to.equal(id);
                    expect(updateSpy.args[0][0].Key.rangeKey).to.equal("2");
                    expect(updateSpy.args[0][0].TableName).to.equal(tableName);
                    assert(rec.extensionWorks());
                    expect(rec.uniqueReference).to.equal(uniqueReference);
                    next();
                }
            ], done);
        });
        it('Timestamps', (done) => {
            var id = getUniqueId();
            tableSchema = new Schema({
                tableName: tableName,
                timestamps: true,
                key: {
                    hash: 'hashKey',
                    range: 'rangeKey'
                },
                schema: {
                    hashKey : joi.string().required(),
                    rangeKey : joi.string().optional(),
                    personalInformation : joi.object().keys({
                        firstName : joi.string().encrypt(),
                        lastName  : joi.string().encrypt(),
                        "0-0"     : joi.optional(),
                        "."     : joi.optional()
                    }),
                    zzzz: joi.number(),
                    foo    : joi.string().required(),
                    arr: joi.array()
                }
            });
            putSpy = sandbox.spy(tableSchema.db, "put");
            deleteSpy = sandbox.spy(tableSchema.db, "delete");
            querySpy = sandbox.spy(tableSchema.db, "query");
            scanSpy = sandbox.spy(tableSchema.db, "scan");
            getSpy = sandbox.spy(tableSchema.db, "get");
            updateSpy = sandbox.spy(tableSchema.db, "update");
            class TableItemTimestamps extends Item {
                constructor(json) {
                    super({
                        attrs: json,
                        schema: tableSchema
                    });
                }
                getFoo(foo) {
                    return 'Hello, ' + "foo" + '!';
                }
                extensionWorks() {
                    return true;
                }
            }
            testTable = new Table({
                schema          : tableSchema,
                itemConstructor : TableItemTimestamps
            });
            let rec = new TableItemTimestamps({
                hashKey  : id,
                rangeKey : "2",
                foo : "abc",
                personalInformation: {
                    firstName: 'John'
                }
            });


            var uniqueReference = {a: true};
            async.series([
                (next) => {
                    rec.create(next);
                },
                (next) => {
                    rec.set("personalInformation.firstName", "Jeff");
                    rec.uniqueReference = uniqueReference;
                    rec.update(next);
                },
                (next) => {
                    const fractionLength = _.last(rec.get("updatedAt").split("\.")).length;
                    expect(fractionLength).to.equal(3 + 1); // 3 digits and a Z
                    expect(rec.get("hashKey")).to.equal(id);
                    assert(updateSpy.args[0][0].UpdateExpression.length);
                    expect(rec.get("personalInformation.firstName")).to.equal("Jeff");
                    expect(Object.keys(updateSpy.args[0][0].ExpressionAttributeValues).length);
                    expect(updateSpy.args[0][0].Key.hashKey).to.equal(id);
                    expect(updateSpy.args[0][0].Key.rangeKey).to.equal("2");
                    expect(updateSpy.args[0][0].TableName).to.equal(tableName);
                    assert(rec.extensionWorks());
                    expect(rec.uniqueReference).to.equal(uniqueReference);
                    next();
                }
            ], done);
        });
        it('Timestamps - extended', (done) => {
            var id = getUniqueId();
            tableSchema = new Schema({
                tableName: tableName,
                timestamps: "EXTENDED",
                key: {
                    hash: 'hashKey',
                    range: 'rangeKey'
                },
                schema: {
                    hashKey : joi.string().required(),
                    rangeKey : joi.string().optional(),
                    personalInformation : joi.object().keys({
                        firstName : joi.string().encrypt(),
                        lastName  : joi.string().encrypt(),
                        "0-0"     : joi.optional(),
                        "."     : joi.optional()
                    }),
                    zzzz: joi.number(),
                    foo    : joi.string().required(),
                    arr: joi.array()
                }
            });
            putSpy = sandbox.spy(tableSchema.db, "put");
            deleteSpy = sandbox.spy(tableSchema.db, "delete");
            querySpy = sandbox.spy(tableSchema.db, "query");
            scanSpy = sandbox.spy(tableSchema.db, "scan");
            getSpy = sandbox.spy(tableSchema.db, "get");
            updateSpy = sandbox.spy(tableSchema.db, "update");
            class TableItemTimestamps extends Item {
                constructor(json) {
                    super({
                        attrs: json,
                        schema: tableSchema
                    });
                }
                getFoo(foo) {
                    return 'Hello, ' + "foo" + '!';
                }
                extensionWorks() {
                    return true;
                }
            }
            testTable = new Table({
                schema          : tableSchema,
                itemConstructor : TableItemTimestamps
            });
            let rec = new TableItemTimestamps({
                hashKey  : id,
                rangeKey : "2",
                foo : "abc",
                personalInformation: {
                    firstName: 'John'
                }
            });

            var uniqueReference = {a: true};
            async.series([
                (next) => {
                    rec.create(next);
                },
                (next) => {
                    rec.set("personalInformation.firstName", "Jeff");
                    rec.uniqueReference = uniqueReference;
                    rec.update(next);
                },
                (next) => {
                    const fractionLength = _.last(rec.get("updatedAt").split("\.")).length;
                    expect(fractionLength).to.equal(3 + 3 + 3 + 1); // 3 milliseconds 3 microseconds 3 nanoseconds and a Z
                    expect(rec.get("hashKey")).to.equal(id);
                    assert(updateSpy.args[0][0].UpdateExpression.length);
                    expect(rec.get("personalInformation.firstName")).to.equal("Jeff");
                    expect(Object.keys(updateSpy.args[0][0].ExpressionAttributeValues).length);
                    expect(updateSpy.args[0][0].Key.hashKey).to.equal(id);
                    expect(updateSpy.args[0][0].Key.rangeKey).to.equal("2");
                    expect(updateSpy.args[0][0].TableName).to.equal(tableName);
                    assert(rec.extensionWorks());
                    expect(rec.uniqueReference).to.equal(uniqueReference);
                    next();
                }
            ], done);
        });
        it('Using expression attribute name', (done) => {
            var id = getUniqueId();
            let rec = new TestTableItem({
                hashKey  : id,
                rangeKey : "2",
                foo : "abc",
                personalInformation: {
                    firstName: 'John'
                }
            });

            var uniqueReference = {a: true};
            async.series([
                (next) => {
                    rec.create(next);
                },
                (next) => {
                    rec.set("personalInformation.0-0", "Jeff");
                    rec.uniqueReference = uniqueReference;
                    rec.update(next);
                },
                (next) => {
                    expect(rec.get("hashKey")).to.equal(id);
                    expect(Object.keys(updateSpy.args[0][0].ExpressionAttributeNames).length);
                    assert(rec.extensionWorks());
                    expect(rec.uniqueReference).to.equal(uniqueReference);
                    expect(rec.get("personalInformation.0-0")).to.equal("Jeff");
                    next();
                }
            ], done);
        });
        describe("Append", function() {
            it("Should work with empty array", function(done) {
                var id = getUniqueId();
                let rec = new TestTableItem({
                    hashKey  : id,
                    rangeKey : "2",
                    foo : "abc",
                    personalInformation: {
                        firstName: 'John'
                    },
                    arr: []
                });

                var uniqueReference = {a: true};
                async.series([
                    (next) => {
                        rec.create(next);
                    },
                    (next) => {
                        rec.append("arr", "Jeff");
                        rec.uniqueReference = uniqueReference;
                        rec.update(next);
                    },
                    (next) => {
                        expect(rec.get("arr")).to.deep.equal(["Jeff"]);
                        expect(rec.uniqueReference).to.equal(uniqueReference);
                        next();
                    }
                ], done);
            });
            it("Should work with non-existent field", function(done) {
                var id = getUniqueId();
                let rec = new TestTableItem({
                    hashKey  : id,
                    rangeKey : "2",
                    foo : "abc",
                    personalInformation: {
                        firstName: 'John'
                    }
                });

                var uniqueReference = {a: true};
                async.series([
                    (next) => {
                        rec.create(next);
                    },
                    (next) => {
                        rec.append("arr", "Jeff");
                        rec.uniqueReference = uniqueReference;
                        rec.update(next);
                    },
                    (next) => {
                        expect(rec.get("arr")).to.deep.equal(["Jeff"]);
                        expect(rec.uniqueReference).to.equal(uniqueReference);
                        next();
                    }
                ], done);
            });
        });
        describe("Add", function() {
            it("Should work with empty array", function(done) {
                var id = getUniqueId();
                let rec = new TestTableItem({
                    hashKey  : id,
                    rangeKey : "2",
                    foo : "abc",
                    personalInformation: {
                        firstName: 'John'
                    },
                    zzzz: 0
                });

                var uniqueReference = {a: true};
                async.series([
                    (next) => {
                        rec.create(next);
                    },
                    (next) => {
                        rec.add("zzzz", 1);
                        rec.uniqueReference = uniqueReference;
                        rec.update(next);
                    },
                    (next) => {
                        expect(rec.get("zzzz")).to.equal(1);
                        expect(rec.uniqueReference).to.equal(uniqueReference);
                        next();
                    }
                ], done);
            });
            it("Should work with non-existent field", function(done) {
                var id = getUniqueId();
                let rec = new TestTableItem({
                    hashKey  : id,
                    rangeKey : "2",
                    foo : "abc",
                    personalInformation: {
                        firstName: 'John'
                    }
                });

                var uniqueReference = {a: true};
                async.series([
                    (next) => {
                        rec.create(next);
                    },
                    (next) => {
                        rec.add("zzzz", 1);
                        rec.uniqueReference = uniqueReference;
                        rec.update(next);
                    },
                    (next) => {
                        expect(rec.get("zzzz")).to.equal(1);
                        expect(rec.uniqueReference).to.equal(uniqueReference);
                        next();
                    }
                ], done);
            });
        });
        it('Failure to validate', (done) => {
            var id = getUniqueId();
            let rec = new TestTableItem({
                hashKey  : id,
                rangeKey : "2",
                foo : "abc",
                personalInformation: {
                    firstName: 'John'
                }
            });

            var uniqueReference = {a: true};
            async.series([
                (next) => {
                    rec.create(next);
                },
                (next) => {
                    rec.set("INVALID_SCHEMA", true);
                    rec.update(function(err) {
                        assert(err);
                        assert(!updateSpy.called);
                        return next();
                    });
                }
            ], done);
        });
    });

    describe("Delete", function() {
        it('Working example', (done) => {
            var id = getUniqueId();
            let rec = new TestTableItem({
                hashKey  : id,
                rangeKey : "2",
                foo : "abc",
                personalInformation: {
                    firstName: 'John'
                }
            });

            var uniqueReference = {a: true};
            async.series([
                (next) => {
                    rec.create(next);
                },
                (next) => {
                    rec.delete(next);
                },
                (next) => {
                    expect(deleteSpy.args[0][0].Key.hashKey).to.equal(id);
                    expect(deleteSpy.args[0][0].Key.rangeKey).to.equal("2");
                    expect(deleteSpy.args[0][0].TableName).to.equal(tableName);
                    next();
                }
            ], done);
        });
    });

    describe("Query", function() {
        it('Working example', (done) => {
            var id = getUniqueId();
            let rec = new TestTableItem({
                hashKey  : id,
                rangeKey : "2",
                foo : "abc",
                personalInformation: {
                    firstName: 'John'
                }
            });
            async.series([
                (next) => {
                    rec.create(next);
                },
                (next) => {
                    testTable.query({
                        KeyConditionExpression: "hashKey = :TOKEN1 AND rangeKey = :TOKEN2",
                        ExpressionAttributeValues: {
                            ":TOKEN1": id,
                            ":TOKEN2": "2"
                        }
                    },  (err, retrievedItems) => {
                        assert(!err);
                        expect(querySpy.args[0][0].TableName).to.equal(tableName);
                        expect(retrievedItems.Items[0].get("foo")).to.equal("abc");
                        assert(retrievedItems.Items[0].extensionWorks());
                        return next();
                    });
                }
            ], done);
        });
    });

    describe("Scan", function() {
        it('Working example', (done) => {
            var id = getUniqueId();
            let rec = new TestTableItem({
                hashKey  : id,
                rangeKey : "2",
                foo : "UNIQUE_FOO",
                personalInformation: {
                    firstName: 'John'
                }
            });
            async.series([
                (next) => {
                    rec.create(next);
                },
                (next) => {
                    testTable.scan({
                        FilterExpression: "foo = :TOKEN1",
                        ExpressionAttributeValues: {
                            ":TOKEN1": "UNIQUE_FOO"
                        }
                    }, function(err, retrievedItems) {
                        assert(!err);
                        expect(scanSpy.args[0][0].TableName).to.equal(tableName);
                        expect(retrievedItems.Items[0].get("foo")).to.equal("UNIQUE_FOO");
                        assert(retrievedItems.Items[0].extensionWorks());
                        return next();
                    });
                }
            ], done);
        });
    });

    describe("Get", function() {
        it('Working example', (done) => {
            var id = getUniqueId();
            let rec = new TestTableItem({
                hashKey  : id,
                rangeKey : "2",
                foo : "abc",
                personalInformation: {
                    firstName: 'John'
                }
            });
            async.series([
                (next) => {
                    rec.create(next);
                },
                (next) => {
                    testTable.get({
                        "hashKey": id,
                        "rangeKey": "2"
                    }, function(err, retrievedItem) {
                        assert(!err);
                        expect(getSpy.args[0][0].TableName).to.equal(tableName);
                        expect(retrievedItem.get("foo")).to.equal("abc");
                        assert(retrievedItem.extensionWorks());
                        return next();
                    });
                },
                (next) => {
                    testTable.get({
                        "hashKey": "99999",
                        "rangeKey": "22222"
                    }, function(err, retrievedItem) {
                        assert(!err);
                        expect(getSpy.args[0][0].TableName).to.equal(tableName);
                        expect(retrievedItem).to.be.undefined;
                        return next();
                    });
                }
            ], done);
        });
        it('get using extra parameters', (done) => {
            var id = getUniqueId();
            let rec = new TestTableItem({
                hashKey  : id,
                rangeKey : "2",
                foo : "abc",
                personalInformation: {
                    firstName: 'John'
                }
            });
            async.series([
                (next) => {
                    rec.create(next);
                },
                (next) => {
                    testTable.get({
                        "hashKey": id,
                        "rangeKey": "2"
                    }, {
                       "AttributesToGet": ["personalInformation"] 
                    }, function(err, retrievedItem) {
                        assert(!err);
                        expect(getSpy.args[0][0].TableName).to.equal(tableName);
                        expect(retrievedItem.get()).to.deep.equal({
                            personalInformation: {
                                firstName: 'John'
                            }
                        });
                        return next();
                    });
                }
            ], done);
        });
        it("get using extra parameters with promisified table", (done) => {
          const promisifiedTable = new PromisifiedTable({
            schema: tableSchema,
            itemConstructor: TestTableItem,
          });
          const id = getUniqueId();
          const rec = new TestTableItem({
            hashKey: id,
            rangeKey: "2",
            foo: "abc",
            personalInformation: {
              firstName: "John",
            },
          });
          async.series(
            [
              (next) => {
                rec.create(next);
              },
              (next) => {
                promisifiedTable
                  .get(
                    {
                      hashKey: id,
                      rangeKey: "2",
                    },
                    {
                      AttributesToGet: ["personalInformation"],
                    }
                  )
                  .then((retrievedItem) => {
                    expect(getSpy.args[0][0].TableName).to.equal(tableName);
                    expect(retrievedItem.get()).to.deep.equal({
                      personalInformation: {
                        firstName: "John",
                      },
                    });
                    next();
                  });
              },
            ],
            done
          );
        });
        it("get using no extra parameters with promisified table", (done) => {
          const promisifiedTable = new PromisifiedTable({
            schema: tableSchema,
            itemConstructor: TestTableItem,
          });
          const id = getUniqueId();
          const rec = new TestTableItem({
            hashKey: id,
            rangeKey: "2",
            foo: "abc",
            personalInformation: {
              firstName: "John",
            },
          });
          async.series(
            [
              (next) => {
                rec.create(next);
              },
              (next) => {
                promisifiedTable
                  .get({
                    hashKey: id,
                    rangeKey: "2",
                  })
                  .then((retrievedItem) => {
                    expect(getSpy.args[0][0].TableName).to.equal(tableName);
                    expect(retrievedItem.get()).to.deep.equal({
                      hashKey: id,
                      rangeKey: "2",
                      foo: "abc",
                      personalInformation: {
                        firstName: "John",
                      },
                    });
                    next();
                  });
              },
            ],
            done
          );
        });
    });
});

var uniqueId = 1;
function getUniqueId() {
    return "" + uniqueId++;
}

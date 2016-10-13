const DB       = require('lib');
const AWS      = require('aws-sdk');
const async    = require('async');
const chai     = require('chai');
const expect   = chai.expect;
const assert   = chai.assert;
const sinon    = require("sinon");

describe('Table', function() {

    this.timeout(60000);

    let awsConfig = {
        region   : 'us-west-2'

    };
    let joi        = DB.joi;
    let Schema     = DB.schema(awsConfig);
    let Table      = DB.table;
    let Item       = DB.item;
    let db;
    let tableName  = process.env.ENV_NAME + '-dynamodb-wrapper-test-table';
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
        sandbox = sinon.sandbox.create();
        var tableSchema = new Schema({
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
                    lastName  : joi.string().encrypt()
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
    });

    afterEach(function() {
        sandbox.restore();
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
                }
            ], done);
        });
    });
});

var uniqueId = 1;
function getUniqueId() {
    return "" + uniqueId++;
}

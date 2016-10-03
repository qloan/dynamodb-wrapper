const DB       = require('.');
const AWS        = require('aws-sdk');
const async    = require('async');
const chai     = require('chai');
const expect   = chai.expect;
const assert   = chai.assert;

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
    let tableName  = process.env.ENV_NAME + '-dynamodb-wrapper-test-table'
    let tableSchema;
    let testTable;
    let TestTableItem;

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
                        AttributeName: 'id',
                        AttributeType: 'S'
                    }],
                    KeySchema: [{
                        AttributeName: 'id',
                        KeyType: 'HASH'
                    }],
                    ProvisionedThroughput: {
                        ReadCapacityUnits: 10,
                        WriteCapacityUnits: 10
                    }
                }, next);
            },
            (next) => {
                db.waitFor('tableExists', {TableName: tableName}, next);
            },
            (next) => {
                //create test schema
                tableSchema = new Schema({
                    tableName: tableName,
                    key: {
                        hash: 'id'
                    },
                    schema: {
                        id : joi.string().required(),
                        personalInformation : joi.object().keys({
                            firstName : joi.string().encrypt(),
                            lastName  : joi.string().encrypt()
                        }),
                        zzzz: joi.number(),
                        foo    : joi.string().required()
                    }
                });
                next();
            },
            (next) => {
                //create test item
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
                }
                TestTableItem = TableItem;
                next();
            },
            (next) => {
                //create test table
                testTable = new Table({
                    schema          : tableSchema,
                    itemConstructor : TestTableItem
                });
                next();
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

    it('should pass', (done) => {
        let rec = new TestTableItem({
            id  : "1",
            foo : "abc",
            personalInformation: {
                firstName: 'John'
            }
        });

        rec.set("foo", "bar");
        rec.set("zzzz", 9);
        //rec.set("personalInformation.firstName", "Jeff");

        rec.update((err) => {
            console.log('##');
            console.dir(err)
            done();
        });


    })
});

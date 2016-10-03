/* Model is the low level interface to dynamodb doc-client. It only exists so we can augment dynamodb-docclient with hooks. All functions here return plain JSON */
const AWS        = require('aws-sdk');
const async      = require('async');
const Observable = require('./util/observable');
const joi        = require('./util/joicrypt');

class Schema extends Observable {

    constructor(args) {
        if(!args.tableName || !args.key || !args.schema) {
            throw new Error('Schema::Invalid arguments');
        }

        super();
        this.db = new AWS.DynamoDB.DocumentClient();

        Object.assign(this, args);

        this.schema = joi.object().keys(this.schema);
    }

    create(itemJson, createParams, cb) {
        if (typeof cb === "undefined") {
            cb = createParams;
            createParams = {};
        }

        let encryptedFields;
        createParams.TableName = this.tableName;
        createParams.Item = itemJson;

        async.series([
            (next) => {
                const result = joi.validate(createParams.Item, this.schema);
                if(result.error) {
                    return next(result.error);
                }
                encryptedFields = result.encryptedFields;
                next();
            },
            (next) => {
                //Fire before event here
                this.emit('beforeCreate', createParams.Item, next);
            },
            (next) => {
                //Fire encrypt here
                this.emit('encrypt', createParams.Item, encryptedFields, next);
            },
            (next) => {
                this.db.put(createParams, next);
            },
            (next) => {
                //Fire after event here
                this.emit('afterCreate', createParams.Item, next);
            }
        ], (err) => {
            return cb(err);
        });
    }

    get(key, getParams, cb) {
        if (typeof cb === "undefined") {
            cb = getParams;
            getParams = {};
        }

        let encryptedFields;
        let data;

        getParams.TableName = this.tableName;
        getParams.Key = key;

        async.series([
            (next) => {
                //Fire before event here
                this.emit('beforeGet', next);
            },
            (next) => {
                this.db.get(getParams, (err, _data) => {
                    data = _data;
                    next(err);
                });
            },
            (next) => {
                //Fire after event here
                this.emit('afterGet', data, next);
            },
            (next) => {
                const result = joi.validate(data.Item, this.schema, {abortEarly: false});
                encryptedFields = result.encryptedFields;
                next();
            },
            (next) => {
                //Fire decrypt event here
                this.emit('decrypt', data.Item, encryptedFields, next);
            }
        ], (err) => {
            cb(err, data);
        });
    }

    update(itemJson, updateParams, cb) {
        let key = {};

        key[this.key.hash] = itemJson[this.key.hash];
        if(this.key.range) {
            key[this.key.range] = itemJson[this.key.range];
        }

        let encryptedFields;
        updateParams.TableName = this.tableName;
        updateParams.Key = key;

        async.series([
            (next) => {
                const result = joi.validate(itemJson, this.schema);
                if(result.error) {
                    return next(result.error);
                }
                encryptedFields = result.encryptedFields;
                next();
            },
            (next) => {
                //Fire before event here
                this.emit('beforeUpdate', itemJson, next);
            },
            (next) => {
                //Fire encrypt here
                this.emit('encrypt', itemJson, encryptedFields, next);
            },
            (next) => {
                this.db.update(updateParams, next);
            },
            (next) => {
                //Fire after event here
                this.emit('afterUpdate', itemJson, next);
            }
        ], (err) => {
            return cb(err);
        });
    }

    delete(keyParams, params, cb) {
        if (typeof cb === "undefined") {
            cb = params;
            params = {};
        }
        let key = {};
        key[this.key.hash] = keyParams[this.key.hash];
        if(this.key.range) {
            key[this.key.range] = keyParams[this.key.range];
        }

        params.TableName = this.tableName;
        params.Key = key;

        async.series([
            (next) => {
                //Fire before event here
                this.emit('beforeDelete', next);
            },
            (next) => {
                this.db.delete(params, next);
            },
            (next) => {
                //Fire after event here
                this.emit('afterDelete', next);
            }
        ], (err) => {
            cb(err);
        });
    }

    query(queryParams={}, cb) {
        queryParams.TableName = this.tableName;

        let data;

        async.series([
            (next) => {
                //Fire before event here
                this.emit('beforeQuery', next);
            },
            (next) => {
                this.db.query(queryParams, (err, _data) => {
                    data = _data;
                    next(err);
                });
            },
            (next) => {
                //Fire after event here
                this.emit('afterQuery', data, next);
            },
            (next) => {
                async.eachSeries(data.Items, (item, eachCb) => {
                    let result = joi.validate(item, this.schema, {abortEarly: false});
                    this.emit('decrypt', item, result.encryptedFields, eachCb);
                }, next);
            }
        ], (err) => {
            cb(err, data);
        });
    }

    scan(scanParams={}, cb) {
        scanParams.TableName = this.tableName;

        let data;

        async.series([
            (next) => {
                //Fire before event here
                this.emit('beforeScan', next);
            },
            (next) => {
                this.db.scan(scanParams, (err, _data) => {
                    data = _data;
                    next(err);
                });
            },
            (next) => {
                //Fire after event here
                this.emit('afterScan', data, next);
            },
            (next) => {
                async.eachSeries(data.Items, (item, eachCb) => {
                    let result = joi.validate(item, this.schema, {abortEarly: false});
                    this.emit('decrypt', item, result.encryptedFields, eachCb);
                }, next);
            }
        ], (err) => {
            cb(err, data);
        });
    }
}

module.exports = function(awsConfig) {
    if(awsConfig) {
       AWS.config.update(awsConfig);
    }
    return Schema;
};

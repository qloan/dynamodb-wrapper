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

    create(data, params, cb) {
        if (typeof cb === "undefined") {
            cb = params;
            params = {};
        }

        let encryptedFields;
        params.TableName = this.tableName;
        params.Item = data;

        async.series([
            (next) => {
                const result = joi.validate(params.Item, this.schema);
                if(result.error) {
                    return next(result.error);
                }
                encryptedFields = result.encryptedFields;
                next();
            },
            (next) => {
                //Fire before event here
                this.emit('beforeCreate', params.Item, next);
            },
            (next) => {
                //Fire encrypt here
                this.emit('encrypt', params.Item, encryptedFields, next);
            },
            (next) => {
                this.db.put(params, next);
            },
            (next) => {
                //Fire after event here
                this.emit('afterCreate', params.Item, next);
            }
        ], (err) => {
            return cb(err);
        });
    }

    get(json, params, cb) {
        if (typeof cb === "undefined") {
            cb = params;
            params = {};
        }

        let encryptedFields;
        let data;

        params.TableName = this.tableName;
        params.Key = json;

        async.series([
            (next) => {
                //Fire before event here
                this.emit('beforeGet', next);
            },
            (next) => {
                this.db.get(params, (err, _data) => {
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

    update(object, params, cb) {
        let key = {};

        key[this.key.hash] = object[this.key.hash];
        if(this.key.range) {
            key[this.key.range] = object[this.key.range];
        }

        let encryptedFields;
        params.TableName = this.tableName;
        params.Key = key;

        async.series([
            (next) => {
                const result = joi.validate(object, this.schema);
                if(result.error) {
                    return next(result.error);
                }
                encryptedFields = result.encryptedFields;
                next();
            },
            (next) => {
                //Fire before event here
                this.emit('beforeUpdate', object, next);
            },
            (next) => {
                //Fire encrypt here
                this.emit('encrypt', object, encryptedFields, next);
            },
            (next) => {
                this.db.update(params,next);
            },
            (next) => {
                //Fire after event here
                this.emit('afterUpdate', object, next);
            }
        ], (err) => {
            return cb(err);
        });
    }

    delete(json, params, cb) {
        if (typeof cb === "undefined") {
            cb = params;
            params = {};
        }
        let key = {};
        key[this.key.hash] = json[this.key.hash];
        if(this.key.range) {
            key[this.key.range] = json[this.key.range];
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

    query(params={}, cb) {
        params.TableName = this.tableName;

        let data;

        async.series([
            (next) => {
                //Fire before event here
                this.emit('beforeQuery', next);
            },
            (next) => {
                this.db.query(params, (err, _data) => {
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

    scan(params={}, cb) {
        params.TableName = this.tableName;

        let data;

        async.series([
            (next) => {
                //Fire before event here
                this.emit('beforeScan', next);
            },
            (next) => {
                this.db.scan(params, (err, _data) => {
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

/* Model is the low level interface to dynamodb doc-client. It only exists so we can augment dynamodb-docclient with hooks. All functions here return plain JSON */
var AWS        = require('aws-sdk');
var joi        = require('joi');
var async      = require('async');
var Observable = require('./util/observable');
var JoiCrypt   = require('./util/joicrypt');

class Schema extends Observable {

    constructor(args={methods: {}}) {
        if(!args.tableName || !args.key || !args.schema) {
            throw new Error('Model::Invalid arguments');
        }
        let jc = new JoiCrypt();

        super();
        this.db = new AWS.DynamoDB.DocumentClient();

        args = Object.assign({}, args);
        Object.assign(this, args);

        this.schema = jc.joi.object().keys(this.schema);
    }

    create(data, params, cb) {
        if (typeof cb === "undefined") {
            cb = params;
            params = {};
        }

        let jc = new JoiCrypt();
        params.TableName = this.tableName;
        params.Item = data;

        async.series([
            (next) => {
                jc.validate(params.Item, this.schema, next);
            },
            (next) => {
                //Fire before event here
                this.emit('beforeCreate', params.Item, next);
            },
            (next) => {
                //Fire encrypt here
                this.emit('encrypt', params.Item, jc.getEncryptedFields(), next);
            },
            (next) => {
                this.db.put(params, next);
            },
            (next) => {
                //Fire after event here
                this.emit('afterCreate', params.Item, next);
            }
        ], cb);
    }

    get(json, params, cb) {
        if (typeof cb === "undefined") {
            cb = params;
            params = {};
        }

        let key = {};
        let data;

        key[this.key.hash] = json[this.key.hash];  //TODO: should also check range key!
        params.TableName = this.tableName;
        params.Key = key;

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
                //Fire decrypt event here
                this.emit('decrypt', data, next); //TODO: Need to send array of encrypted keys!
            }
        ], (err) => {
            cb(err, data);
        });
    }

    update(object, params, cb) {
        let key = {};
        let jc  = new JoiCrypt();

        key[this.key.hash] = object[this.key.hash];
        params.TableName = this.tableName;
        params.Key = key;

        async.series([
            (next) => {
                jc.validate(object, this.schema, next);
            },
            (next) => {
                //Fire before event here
                this.emit('beforeUpdate', object, next);
            },
            (next) => {
                //Fire encrypt here
                this.emit('encrypt', object, jc.getEncryptedFields(), next);
            },
            (next) => {
                this.db.update(params,next);
            },
            (next) => {
                //Fire after event here
                this.emit('afterUpdate', object, next);
            }
        ], cb);
    }

    delete(json, params, cb) {
        if (typeof cb === "undefined") {
            cb = params;
            params = {};
        }
        let key = {};
        key[this.key.hash] = json[this.key.hash];
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
                //Fire decrypt event here
                this.emit('decrypt', data, next);
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
                //Fire decrypt event here
                this.emit('decrypt', data, next);
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

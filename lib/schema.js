/* Model is the low level interface to dynamodb doc-client. It only exists so we can augment dynamodb-docclient with hooks. All functions here return plain JSON */
var AWS   = require('aws-sdk');
var joi   = require('joi');
var async = require('async');
var JoiCrypt = require('./joicrypt');

class Schema {

    constructor(args={methods: {}}) {
        if(!args.tableName || !args.key || !args.schema) {
            throw new Error('Model::Invalid arguments');
        }
        this.db = new AWS.DynamoDB.DocumentClient();
        this.jc = new JoiCrypt();

        args = Object.assign({}, args);
        Object.assign(this, args);

        this.schema = this.jc.joi.object().keys(this.schema);
    }

    create(data, params, cb) {
        if (typeof cb === "undefined") {
            cb = params;
            params = {};
        }

        params.TableName = this.tableName;
        params.Item = data;

        async.series([
            (next) => {
                this.jc.validate(params.Item, this.schema, next);
            },
            (next) => {
                //Fire before event here
                //this.emit('beforeCreate', params.Item, next);
                next();
            },
            (next) => {
                //Fire encrypt here
                //this.emit('encrypt', params.Item, this.jc.getEncryptedFields(), next);
                next();
            },
            (next) => {
                this.db.put(params, next);
            },
            (next) => {
                //Fire after event here
                next();
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
                next();
            },
            (next) => {
                this.db.get(params, (err, _data) => {
                    data = _data;
                    next(err);
                });
            },
            (next) => {
                //Fire after event here
                next();
            },
            (next) => {
                //Fire decrypt event here
                next();
            }
        ], (err) => {
            cb(err, data);
        });
    }

    update(object, params, cb) {
        let key = {};

        key[this.key.hash] = object[this.key.hash];
        params.TableName = this.tableName;
        params.Key = key;

        async.series([
            (next) => {
                this.jc.validate(object, this.schema, next);
            },
            (next) => {
                //Fire before event here
                next();
            },
            (next) => {
                //Fire encrypt here
                next();
            },
            (next) => {
                this.db.update(params,next);
            },
            (next) => {
                //Fire after event here
                next();
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
                next();
            },
            (next) => {
                this.db.delete(params, next);
            },
            (next) => {
                //Fire after event here
                next();
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
                next();
            },
            (next) => {
                this.db.query(params, (err, _data) => {
                    data = _data;
                    next(err);
                });
            },
            (next) => {
                //Fire after event here
                next();
            },
            (next) => {
                //Fire decrypt event here
                next();
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
                next();
            },
            (next) => {
                this.db.scan(params, (err, _data) => {
                    data = _data;
                    next(err);
                });
            },
            (next) => {
                //Fire after event here
                next();
            },
            (next) => {
                //Fire decrypt event here
                next();
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

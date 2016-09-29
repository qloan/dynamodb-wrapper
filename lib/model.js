/* Model is the low level interface to dynamodb doc-client. It only exists so we can augment dynamodb-docclient with hooks. All functions here return plain JSON */
var AWS   = require('aws-sdk');
var joi   = require('joi');
var async = require('async');

var db    = new AWS.DynamoDB.DocumentClient();

class Model {

    constructor(args={methods: {}}) {
        if(!args.tableName || !args.key || !args.schema) {
            throw new Error('Model::Invalid arguments');
        }
        args = Object.assign({}, args);
        Object.assign(this, args);
        this.schema = joi.object().keys(this.schema);
    }

    create(data, _params, cb) {
        let params = {
            TableName : this.tableName,
            Item      : data
        };
        let _this = this;

        if(typeof _params === 'object') {
            Object.assign(params, _params);
        }else {
            cb = _params;
        }

        async.waterfall([
            (next) => {
                joi.validate(params.Item, this.schema, next);
            },
            (val, next) => {
                db.put(params, next);
            }
        ], (err, _data) => {
            // _data here equals {}
            // I don't know why
            if(err) {
                return cb(err);
            }

            cb(err, data);
        });
    }

    get(key, _params, cb) {
        let params = {
            TableName  : this.tableName,
            Key        : key
        };
        let _this = this;

        if(typeof _params === 'object') {
            Object.assign(params, _params);
        }else {
            cb = _params;
        }

        db.get(params, (err, data) => {
            if(err) {
                return cb(err);
            }

            cb(err, data);
        });
    }

    update(object, _params, cb) {
        var key = {};
        key[this.key.hash] = object[this.key.hash];
        var params = {
            "TableName": this.tableName,
            "Key": key,
            "UpdateExpression": _params.UpdateExpression,
            "ExpressionAttributeNames": _params.ExpressionAttribuetNames,
            "ExpressionAttributeValues": _params.ExpressionAttributeValues
        };

        db.update(params, (err, json) => {
            if (err) {
                return cb(err);
            } else if (!json) {
                return cb(new Error("No data returned from db"));
            }

            return cb(null, json);
        });
    }

    delete(key, _params, cb) {
        let params = {
            TableName : this.tableName,
            Key       : key
        };
        let _this = this;

        if(typeof _params === 'object') {
            Object.assign(params, _params);
        }else {
            cb = _params;
        }

        db.delete(params, cb);
    }

    query(_params={}, cb) {
        let params = {
            TableName : this.tableName
        };
        let _this = this;

        Object.assign(params, _params);

        db.query(params, (err, data) => {
            if(err) {
                return cb(err);
            }

            cb(err, data);
        });
    }

    scan(_params={}, cb) {
        let params = {
            TableName : this.tableName
        };
        let _this = this;

        Object.assign(params, _params);

        db.scan(params, (err, data) => {
            if(err) {
                return cb(err);
            }

            cb(err, data);
        });
    }
}

module.exports = Model;

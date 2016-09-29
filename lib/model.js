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
        ], (err, data) => {
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

    update(key, _params, cb) {
        var params = {
            "TableName": this.tableName,
            "Key": this.key,
            "UpdateExpression": params.UpdateExpression,
            "ExpressionAttributeNames": params.ExpressionAttribuetNames,
            "ExpressionAttributeValues": params.ExpressionAttributeValues
        };
        Object.assign(params, _params);
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

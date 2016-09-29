/* Model is the low level interface to dynamodb doc-client. It only exists so we can augment dynamodb-docclient with hooks. All functions here return plain JSON */
var AWS   = require('aws-sdk');
var joi   = require('joi');
var async = require('async');

class Schema {

    constructor(args={methods: {}}) {
        if(!args.tableName || !args.key || !args.schema) {
            throw new Error('Model::Invalid arguments');
        }
        this.db = new AWS.DynamoDB.DocumentClient();
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
                this.db.put(params, next);
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

    get(json, _params, cb) {
        var key = {};
        key[this.key.hash] = json[this.key.hash];
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

        this.db.get(params, (err, data) => {
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
            "Key": key
        };

        Object.assign(params, _params);

        this.db.update(params, (err, json) => {
            if (err) {
                return cb(err);
            }

            return cb(null, object);
        });
    }

    delete(json, _params, cb) {
        var key = {};
        key[this.key.hash] = json[this.key.hash];
        let params = {
            TableName : this.tableName,
            Key       : key
        };

        if(typeof _params === 'object') {
            Object.assign(params, _params);
        }else {
            cb = _params;
        }

        this.db.delete(params, cb);
    }

    query(_params={}, cb) {
        let params = {
            TableName : this.tableName
        };
        Object.assign(params, _params);

        this.db.query(params, (err, data) => {
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
        Object.assign(params, _params);

        this.db.scan(params, (err, data) => {
            if(err) {
                return cb(err);
            }

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

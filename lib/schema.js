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

    create(data, params, cb) {
        if (typeof cb === "undefined") {
            cb = params;
            params = {};
        }
        params.TableName = this.tableName;
        params.Item = data;

        let validationResult = joi.validate(params.Item, this.schema);
        if (validationResult.error) {
            return cb(validationResult.error);
        }

        this.db.put(params, (err) => {
            return cb(err);
        });
    }

    get(json, params, cb) {
        if (typeof cb === "undefined") {
            cb = params;
            params = {};
        }
        var key = {};
        key[this.key.hash] = json[this.key.hash];
        params.TableName = this.tableName;
        params.Key = key;

        this.db.get(params, (err, data) => {
            if(err) {
                return cb(err);
            }

            cb(err, data);
        });
    }

    update(object, params, cb) {
        var key = {};
        key[this.key.hash] = object[this.key.hash];
        params.TableName = this.tableName;
        params.Key = key;

        let validationResult = joi.validate(object, this.schema);
        if (validationResult.error) {
            return cb(validationResult.error);
        }

        this.db.update(params, (err) => {
            return cb(err);
        });
    }

    delete(json, params, cb) {
        if (typeof cb === "undefined") {
            cb = params;
            params = {};
        }
        var key = {};
        key[this.key.hash] = json[this.key.hash];
        params.TableName = this.tableName;
        params.Key = key;

        this.db.delete(params, cb);
    }

    query(params={}, cb) {
        params.TableName = this.tableName;

        this.db.query(params, (err, data) => {
            if(err) {
                return cb(err);
            }

            cb(err, data);
        });
    }

    scan(params={}, cb) {
        params.TableName = this.tableName;

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

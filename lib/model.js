var AWS   = require('aws-sdk');
var joi   = require('joi');
var async = require('async');
var Item  = require('./item');

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

        if(typeof(_params) == 'object') {
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

            let item = new Item({
                model: _this,
                attrs : params.Item
            });

            cb(err, item);
        })
    }

    get(key, _params, cb) {
        let params = {
            TableName  : this.tableName,
            Key        : key
        };
        let _this = this;

        if(typeof(_params) == 'object') {
            Object.assign(params, _params);
        }else {
            cb = _params;
        }

        db.get(params, (err, data) => {
            if(err) {
                return cb(err);
            }

            let item = new Item({
                model : _this,
                attrs : data.Item
            });

            cb(err, item);
        });
    }

    update(params) {

    }

    delete(key, _params, cb) {
        let params = {
            TableName : this.tableName,
            Key       : key
        };
        let _this = this;

        if(typeof(_params) == 'object') {
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
            data.Items = data.Items.map((item) => {
                return new Item({
                    model : _this,
                    attrs : item
                });
            });
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
            data.Items = data.Items.map((item) => {
                return new Item({
                    model : _this,
                    attrs : item
                });
            });
            cb(err, data);
        });
    }
}

module.exports = Model;

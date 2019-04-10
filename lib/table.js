/* Table is a factory for instances of item. Factory has methods get, query, and scan. All functions here return our extended object models. */
const _              = require('lodash');

class Table {
    constructor(args) {
        if(!args.schema || !args.itemConstructor) {
            throw new Error('Model::Invalid arguments');
        }
        Object.assign(this, args);
    }

    get(key, getParams, cb) {
        if (typeof cb === "undefined") {
            cb = getParams;
            getParams = {};
        }
        this.schema.get(key, getParams, (err, data) => {
            if(err) {
                return cb(err);
            }

            data = _.get(data, 'Item');
            let item;
            
            if(typeof(data) == 'object') {
                item = new this.itemConstructor(data);
            }

            return cb(null, item);
        });
    }

    query(params={}, cb) {
        this.schema.query(params, (err, data) => {
            if(err) {
                return cb(err);
            }

            data.Items = data.Items.map((item) => {
                return new this.itemConstructor(item);
            });

            return cb(null, data);
        });
    }

    scan(params={}, cb) {
        this.schema.scan(params, (err, data) => {
            if(err) {
                return cb(err);
            }

            data.Items = data.Items.map((item) => {
                return new this.itemConstructor(item);
            });

            return cb(null, data);
        });
    }

    delete(key, cb) {
        this.schema.delete(key, (err) => {
            return cb(err);
        });
    }
}

module.exports = Table;

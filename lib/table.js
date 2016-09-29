/* Table is a factory for instances of item. Factory has methods get, query, and scan. All functions here return our extended object models. */
class Table {
    constructor(args) {
        if(!args.schema || !args.itemConstructor) {
            throw new Error('Model::Invalid arguments');
        }
        Object.assign(this, args);
    }

    get(key, cb) {
        this.schema.get(key, (err, data) => {
            if(err) {
                return cb(err);
            }

            return cb(null, new this.itemConstructor(data.Item));
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
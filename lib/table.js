/* Table is a factory for instances of item. Factory has methods get, query, and scan. All functions here return our extended object models. */
class Table {
    constructor(args) {
        if(!args.model || !args.itemConstructor) {
            throw new Error('Model::Invalid arguments');
        }
        args = Object.assign({}, args);
        Object.assign(this, args);
    }

    get(key, cb) {
        this.model.get(key, (err, data) => {
            if(err) {
                return cb(err);
            }

            return cb(err, new this.itemConstructor(data.Item));
        });
    }

    query(_params={}, cb) {
        let params = {
            TableName : this.tableName
        };
        let _this = this;

        Object.assign(params, _params);

        this.model.query(params, (err, data) => {
            if(err) {
                return cb(err);
            }

            data.Items = data.Items.map((item) => {
                return new this.itemConstructor(item);
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

        this.model.scan(params, (err, data) => {
            if(err) {
                return cb(err);
            }

            data.Items = data.Items.map((item) => {
                return new this.itemConstructor(item);
            });

            cb(err, data);
        });
    }
}

module.exports = Table;
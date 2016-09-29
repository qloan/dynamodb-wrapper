class Table {
    constructor(args) {
        if(!args.model || !args.itemConstructor) {
            throw new Error('Model::Invalid arguments');
        }
        args = Object.assign({}, args);
        Object.assign(this, args);
    }

    get(key, cb) {
        let params = {
            TableName  : this.tableName,
            Key        : key
        };

        this.model.get(params, (err, data) => {
            if(err) {
                return cb(err);
            }

            cb(err, new this.itemConstructor(data));
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
var UpdateManager = require("./UpdateManager");
var _attrs        = Symbol();

class Item {
    constructor(args={}) {
        if(!args.schema || !args.attrs) {
            throw new Error('Invalid arguments');
        }

        this[_attrs] = args.attrs;
        delete args.attrs;

        Object.assign(this, args);
        this.updateManager = new UpdateManager(this[_attrs]);
    }
    create(cb) {
        this.schema.create(this.updateManager.getJson(), (err) => {
            if (err) {
                return cb(err);
            }

            this.updateManager = new UpdateManager(this.updateManager.getJson());
            return cb(null);
        });
    }
    set(field, value) {
        this.updateManager.set(field, value);
    }
    update(cb) {
        this.schema.update(this.updateManager.getJson(), this.updateManager.getDynamoUpdateExpression(), (err, item) => {
            if (err) {
                return cb(err);
            }

            this.updateManager = new UpdateManager(this.updateManager.getJson());
            return cb();
        });
    }
    delete(cb) {
        this.schema.delete(this.updateManager.getJson(), cb);
    }
}

module.exports = Item;

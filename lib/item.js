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
        var json = this.updateManager.get();
        this.schema.create(json, (err) => {
            if (err) {
                return cb(err);
            }

            this.updateManager = new UpdateManager(json);
            return cb(null);
        });
    }
    set(field, value) {
        this.updateManager.set(field, value);
    }
    add(field, value) {
        this.updateManager.add(field, value);
    }
    remove(field) {
        this.updateManager.remove(field);
    }
    update(cb) {
        var json = this.updateManager.get();
        this.schema.update(json, this.updateManager.getDynamoUpdateExpression(), (err, item) => {
            if (err) {
                return cb(err);
            }

            this.updateManager = new UpdateManager(json);
            return cb();
        });
    }
    delete(cb) {
        this.schema.delete(this.updateManager.get(), cb);
    }
}

module.exports = Item;

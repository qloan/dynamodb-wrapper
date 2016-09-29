var UpdateManager = require("./UpdateManager");
class Item {
    constructor(args={}) {
        if(!args.model || !args.attrs) {
            throw new Error('Invalid arguments');
        }
        args = Object.assign({}, args);
        Object.assign(this, args);

        //Set all item methods on instance
        Object.assign(this, args.model.methods);
        this.updateManager = new UpdateManager(args.attrs);
    }
    create(cb) {
        this.model.create(this.updateManager.getJson, (err, item) => {
            if (err) {
                return cb(err);
            }

            this.updateManager.updateJson(item);
            return cb(null, this);
        });
    }
    set(field, value) {
        this.updateManager.set(field, value);
    }
    update(cb) {
        this.model.update((err, item) => {
            if (err) {
                return cb(err);
            }

            this.updateManager.updateJson(item);
            return cb(null, this);
        });
    }
}

module.exports = Item;

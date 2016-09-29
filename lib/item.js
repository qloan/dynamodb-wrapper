var UpdateManager = require("./UpdateManager");
class Item {
    constructor(args={}) {
        if(!args.model || !args.attrs) {
            throw new Error('Invalid arguments');
        }
        args = Object.assign({}, args);
        Object.assign(this, args);
        this.updateManager = new UpdateManager(args.attrs);
    }
    create(cb) {
        this.model.create(this.updateManager.getJson(), (err, data) => {
            if (err) {
                return cb(err);
            }

            this.updateManager.updateJson(data);
            return cb(null);
        });
    }
    set(field, value) {
        this.updateManager.set(field, value);
    }
    update(cb) {
        this.model.update(this.updateManager.getJson(), this.updateManager.getDynamoUpdateExpression(), (err, item) => {
            if (err) {
                return cb(err);
            }

            this.updateManager.updateJson(item);
            return cb(null);
        });
    }
}

module.exports = Item;

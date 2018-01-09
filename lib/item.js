const rocketLoansSdk = require("rocketloans-sdk");
const UpdateManager  = require("./updateManager");
const util           = rocketLoansSdk.util;

class Item {
    constructor(args={}) {
        if(!args.schema) {
            throw new Error('Schema is required');
        }
        this.schema = args.schema;
        this.updateManager = new UpdateManager(args.attrs || {});
        this.locals = {
            attrs: args.attrs || {}
        };
    }
    extend(key, extensionObj) {
        this[key] = {};
        for (var i in extensionObj) {
            this[key][i] = extensionObj[i].bind(this);
        }
    }
    get(field=[], value) {
        return util.getObjKey(this.locals.attrs, field, value);
    }
    set(field, value) {
        this.updateManager.set(field, value);
        util.setObjKey(this.locals.attrs, field, value);
    }
    add(field, value=0) {
        this.updateManager.add(field, value);
        value = parseInt(util.getObjKey(this.locals.attrs, field, 0)) + parseInt(value);
        util.setObjKey(this.locals.attrs, field, value);
    }
    append(field, value) {
        this.updateManager.append(field, value);
        const arr = util.getObjKey(this.locals.attrs, field, []);
        arr.push(value);

        util.setObjKey(this.locals.attrs, field, arr);
    }
    remove(field) {
        this.updateManager.remove(field);
        this.locals.attrs = this.updateManager.get();
    }
    create(cb) {
        if(this.schema.timestamps) {
            this.set('createdAt', new Date().toISOString());
        }
        this.schema.create(this.locals.attrs, (err) => {
            return cb(err);
        });
    }
    update(cb) {
        if(this.schema.timestamps) {
            this.set('updatedAt', new Date().toISOString());
        }
        this.schema.update(this.locals.attrs, this.updateManager.getDynamoUpdateExpression(), (err, data) => {
            return cb(err);
        });
    }
    delete(cb) {
        this.schema.delete(this.locals.attrs, (err) => {
            return cb(err);
        });
    }
}

module.exports = Item;

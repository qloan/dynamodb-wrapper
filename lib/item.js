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
            attrs: this.updateManager.get()
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
        this.locals.attrs = this.updateManager.get();
    }
    add(field, value) {
        this.updateManager.add(field, value);
        this.locals.attrs = this.updateManager.get();
    }
    append(field, value) {
        this.updateManager.append(field, value);
        this.locals.attrs = this.updateManager.get();
    }
    remove(field) {
        this.updateManager.remove(field);
        this.locals.attrs = this.updateManager.get();
    }
    create(cb) {
        if(this.schema.timestamps) {
            this.set('createdAt', new Date().toISOString());
        }
        let json = this.updateManager.get();
        this.schema.create(json, (err) => {
            if(!err) {
                this.updateManager = new UpdateManager(json);
                this.locals.attrs = this.updateManager.get();
            }
            return cb(err);
        });
    }
    update(cb) {
        if(this.schema.timestamps) {
            this.set('updatedAt', new Date().toISOString());
        }
        let json = this.updateManager.get();
        this.schema.update(json, this.updateManager.getDynamoUpdateExpression(), (err, data) => {
            if(!err && data) {
                this.updateManager = new UpdateManager(data);
                this.locals.attrs = this.updateManager.get();
            }
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

var UpdateManager = require("./updateManager");
var util = require("./util/util");
var _attrs        = Symbol();

class Item {
    constructor(args={}) {
        if(!args.schema) {
            throw new Error('Schema is required');
        }
        this.schema = args.schema;
        this.updateManager = new UpdateManager(args.attrs || {});
        this.locals = {};
    }
    extend(key, extensionObj) {
        this[key] = {};
        for (var i in extensionObj) {
            this[key][i] = extensionObj[i].bind(this);
        }
    }
    get(field, value) {
        return this.updateManager.get(field, value);
    }
    set(field, value) {
        this.updateManager.set(field, value);
    }
    add(field, value) {
        this.updateManager.add(field, value);
    }
    append(field, value) {
        this.updateManager.append(field, value);
    }
    remove(field) {
        this.updateManager.remove(field);
    }
    create(cb) {
        if(this.schema.timestamps) {
            this.set('createdAt', this.getTimestamp());
        }
        let json = this.updateManager.get();
        this.schema.create(json, (err) => {
            if(!err) {
                this.updateManager = new UpdateManager(json);
            }
            return cb(err);
        });
    }
    update(cb) {
        if(this.schema.timestamps) {
            this.set('updatedAt', this.getTimestamp());
        }

        if (this.beforeUpdate && typeof this.beforeUpdate() === 'function') { 
            this.beforeUpdate() 
        }

        let json = this.updateManager.get();
        this.schema.update(json, this.updateManager.getDynamoUpdateExpression(), (err, data) => {
            if(!err && data) {
                this.updateManager = new UpdateManager(data);
            }
            return cb(err);
        });
    }
    delete(cb) {
        this.schema.delete(this.updateManager.get(), (err) => {
            return cb(err);
        });
    }
    getTimestamp() {
        if (this.schema.timestamps === "EXTENDED") {
            return util.extendedTimestamp();
        }
        return new Date().toISOString();
    }
    acquireLock(params, cb) {
        params.now = params.now || new Date();
        params.ms = params.ms || 1000;
        let ts = Math.round(params.now.getTime() + params.ms);
        let lockTimestamp = new Date(ts).toISOString();
        let currentTimestamp = params.now.toISOString();
        this.schema.db.update({
            UpdateExpression: 'SET #lock = :lockTimestamp',
            Key: this.schema.getItemKey(this.get()),
            TableName: this.schema.tableName,
            ExpressionAttributeValues: {
                ':lockTimestamp': lockTimestamp,
                ':currentTimestamp': currentTimestamp
            },
            ExpressionAttributeNames: {
                '#lock': 'internal_locks_replicate_to_rds'
            },
            ConditionExpression: "attribute_not_exists(#lock) or :currentTimestamp > #lock"
        }, (err, output) => {
            if (err) {
                if (err.code === "ConditionalCheckFailedException") {
                    return cb(null, {
                        lockAcquired: false
                    });
                }
                return cb(err, {
                    lockAcquired: false
                });
            }
            return cb(null, {
                lockAcquired: true
            });
        });
    }
}

module.exports = Item;

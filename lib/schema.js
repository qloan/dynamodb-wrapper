/* Model is the low level interface to dynamodb doc-client. It only exists so we can augment dynamodb-docclient with hooks. All functions here return plain JSON */
const AWS            = require('aws-sdk');
const async          = require('async');
const Observable     = require('./util/observable');
const joi            = require('./util/joicrypt');
const _              = require('lodash');

class Schema extends Observable {

    constructor(args={createTable: true}) {
        if(!args.tableName || !args.key || !args.schema) {
            throw new Error('Schema::Invalid arguments');
        }

        super();
        this.db = new AWS.DynamoDB.DocumentClient();

        Object.assign(this, args);

        if(this.timestamps) {
            this.schema.createdAt = joi.string().isoDate();
            this.schema.updatedAt = joi.string().isoDate();
        }

        if(this.tableDefinition && this.createTable) {
            this._db = new AWS.DynamoDB();
            this.createTable(this.tableDefinition);
        }

        this.schema = joi.object().keys(this.schema);
    }

    create(itemJson, createParams, cb) {
        if (typeof cb === "undefined") {
            cb = createParams;
            createParams = {};
        }

        let encryptedFields = [];
        let compressedFields = [];
        createParams.TableName = this.tableName;
        createParams.Item = itemJson;

        async.series([
            (next) => {
                const result = joi.validate(createParams.Item, this.schema);
                if(result.error) {
                    return next(result.error);
                }
                encryptedFields = result.encryptedFields;
                compressedFields = result.compressedFields;
                next();
            },
            (next) => {
                //Fire before event here
                this.emit('beforeCreate', createParams.Item, next);
            },
            (next) => {
                //Fire compress here
                if(typeof(createParams.Item) == 'object' && compressedFields.length) {
                    this.emit('createCompress', createParams.Item, compressedFields, next);
                }else {
                    next();
                }
            },
            (next) => {
                //Fire encrypt here
                if(typeof(createParams.Item) == 'object' && encryptedFields.length) {
                    this.emit('createEncrypt', createParams.Item, encryptedFields, next);
                }else {
                    next();
                }
            },
            (next) => {
                this.db.put(createParams, next);
            },
            (next) => {
                //Fire after event here
                this.emit('afterCreate', createParams.Item, next);
            }
        ], (err) => {
            return cb(err);
        });
    }

    get(key, getParams, cb) {
        if (typeof cb === "undefined") {
            cb = getParams;
            getParams = {};
        }

        let encryptedFields = [];
        let compressedFields = [];
        let data;

        getParams.TableName = this.tableName;
        getParams.Key = key;

        async.series([
            (next) => {
                //Fire before event here
                this.emit('beforeGet', next);
            },
            (next) => {
                this.db.get(getParams, (err, _data) => {
                    data = _data;
                    next(err);
                });
            },
            (next) => {
                //Fire after event here
                this.emit('afterGet', data, next);
            },
            (next) => {
                const result = joi.validate(_.get(data, 'Item'), this.schema, {abortEarly: false});
                encryptedFields = result.encryptedFields;
                compressedFields = result.compressedFields;
                next();
            },
            (next) => {
                //Fire decompress event here
                if(typeof(_.get(data, 'Item')) == 'object' && compressedFields.length) {
                    this.emit('decompress', _.get(data, 'Item'), compressedFields, next);
                }else {
                    next();
                }
            },
            (next) => {
                //Fire decrypt event here
                if(typeof(_.get(data, 'Item')) == 'object' && encryptedFields.length) {
                    this.emit('decrypt', _.get(data, 'Item'), encryptedFields, next);
                }else {
                    next();
                }
            }
        ], (err) => {
            cb(err, data);
        });
    }

    update(itemJson, updateParams, cb) {
        let key = {};

        key[this.key.hash] = itemJson[this.key.hash];
        if(this.key.range) {
            key[this.key.range] = itemJson[this.key.range];
        }

        let encryptedFields = [];
        let compressedFields = [];
        let requiresEncryption;
        let requiresCompression;
        let data;

        updateParams.TableName = this.tableName;
        updateParams.Key = key;
        updateParams.ReturnValues = 'ALL_NEW';

        async.series([
            (next) => {
                const result = joi.validate(itemJson, this.schema);
                if(result.error) {
                    return next(result.error);
                }
                next();
            },
            (next) => {
                //Fire before event here
                this.emit('beforeUpdate', itemJson, next);
            },
            (next) => {
                Object.keys(updateParams.ExpressionAttributeValues).forEach((token) => {
                    token = updateParams.ExpressionAttributeValues[token];
                    if(typeof(token) == 'object' && (token.action == 'SET' || token.action == 'APPEND')) {
                        token.obj = {};
                        _.set(token.obj, token.field, token.value);

                        const result = joi.validate(token.obj, this.schema, {abortEarly: false});
                        token.encryptedFields = result.encryptedFields;
                        token.compressedFields = result.compressedFields;
                        if(result.encryptedFields.length) {
                            requiresEncryption = true;
                        }
                        if(result.compressedFields.length) {
                            requiresCompression = true;
                        }
                    }
                });
                next();
            },
            (next) => {
                //Fire compress here
                if(requiresCompression) {
                    this.emit('updateCompress', itemJson, updateParams, next);
                }else {
                    next();
                }
            },
            (next) => {
                //Fire encrypt here
                if(requiresEncryption) {
                    this.emit('updateEncrypt', itemJson, updateParams, next);
                }else {
                    next();
                }
            },
            (next) => {
                Object.keys(updateParams.ExpressionAttributeValues).forEach((token) => {
                    if(typeof(updateParams.ExpressionAttributeValues[token]) == 'object') {
                        updateParams.ExpressionAttributeValues[token] = updateParams.ExpressionAttributeValues[token].value;
                    }
                });
                next();
            },
            (next) => {
                this.db.update(updateParams, (err, _data) => {
                    if(_data instanceof Object) {
                        data = _data.Attributes;
                    }
                    next(err);
                });
            },
            (next) => {
                const result = joi.validate(data, this.schema, {abortEarly: false});
                encryptedFields = result.encryptedFields;
                compressedFields = result.compressedFields;
                next();
            },
            (next) => {
                //Fire decompress event here
                if(typeof(data) == 'object' && compressedFields.length) {
                    this.emit('decompress', data, compressedFields, next);
                }else {
                    next();
                }
            },
            (next) => {
                //Fire decrypt event here
                if(typeof(data) == 'object' && encryptedFields.length) {
                    this.emit('decrypt', data, encryptedFields, next);
                }else {
                    next();
                }
            },
            (next) => {
                //Fire after event here
                this.emit('afterUpdate', data, next);
            }
        ], (err) => {
            return cb(err, data);
        });
    }

    delete(keyParams, params, cb) {
        if (typeof cb === "undefined") {
            cb = params;
            params = {};
        }
        let key = {};
        key[this.key.hash] = keyParams[this.key.hash];
        if(this.key.range) {
            key[this.key.range] = keyParams[this.key.range];
        }

        params.TableName = this.tableName;
        params.Key = key;

        async.series([
            (next) => {
                //Fire before event here
                this.emit('beforeDelete', next);
            },
            (next) => {
                this.db.delete(params, next);
            },
            (next) => {
                //Fire after event here
                this.emit('afterDelete', next);
            }
        ], (err) => {
            cb(err);
        });
    }

    query(queryParams={}, cb) {
        queryParams.TableName = this.tableName;

        let data;

        async.series([
            (next) => {
                //Fire before event here
                this.emit('beforeQuery', next);
            },
            (next) => {
                this.db.query(queryParams, (err, _data) => {
                    data = _data;
                    next(err);
                });
            },
            (next) => {
                //Fire after event here
                this.emit('afterQuery', data, next);
            },
            (next) => {
                async.eachSeries(data.Items, (item, eachCb) => {
                    eachCb = setImmediate.bind(null, eachCb);
                    let result = joi.validate(item, this.schema, {abortEarly: false});
                    async.series([
                        (seriesNext) => {
                            seriesNext=setImmediate.bind(null, seriesNext);
                            if(typeof(item) == 'object' && result.compressedFields.length) {
                                this.emit('decompress', item, result.compressedFields, seriesNext);
                            }else {
                                seriesNext();
                            }
                        },
                        (seriesNext) => {
                            seriesNext=setImmediate.bind(null, seriesNext);
                            if(typeof(item) == 'object' && result.encryptedFields.length) {
                                this.emit('decrypt', item, result.encryptedFields, seriesNext);
                            }else {
                                seriesNext();
                            }
                        }
                    ], eachCb);
                }, next);
            }
        ], (err) => {
            cb(err, data);
        });
    }

    scan(scanParams={}, cb) {
        scanParams.TableName = this.tableName;

        let data;

        async.series([
            (next) => {
                //Fire before event here
                this.emit('beforeScan', next);
            },
            (next) => {
                this.db.scan(scanParams, (err, _data) => {
                    data = _data;
                    next(err);
                });
            },
            (next) => {
                //Fire after event here
                this.emit('afterScan', data, next);
            },
            (next) => {
                async.eachSeries(data.Items, (item, eachCb) => {
                    let result = joi.validate(item, this.schema, {abortEarly: false});

                    async.series([
                        (seriesNext) => {
                            if(typeof(item) == 'object' && result.compressedFields.length) {
                                this.emit('decompress', item, result.compressedFields, seriesNext);
                            }else {
                                seriesNext();
                            }
                        },
                        (seriesNext) => {
                            if(typeof(item) == 'object' && result.encryptedFields.length) {
                                this.emit('decrypt', item, result.encryptedFields, seriesNext);
                            }else {
                                seriesNext();
                            }
                        }
                    ], eachCb);
                }, next);
            }
        ], (err) => {
            cb(err, data);
        });
    }

    createTable(tableDefinition={}) {

        this._db.describeTable({
            TableName: tableDefinition.TableName
        }, (err, data) => {
            if(err && err.code === 'ResourceNotFoundException') {
                async.series([
                    (next) => {
                        this._db.createTable(tableDefinition, next);
                    },
                    (next) => {
                        this._db.waitFor('tableExists', {TableName: tableDefinition.TableName}, next);
                    }
                ], (err, data) => {
                    this.emit('tableExists', err, tableDefinition.TableName, data, () => {});
                });
            }else {
                this.emit('tableExists', err, tableDefinition.TableName, data, () => {});
            }
        });
    }
}

module.exports = function(awsConfig) {
    if(awsConfig) {
       AWS.config.update(awsConfig);
    }
    return Schema;
};

const Joi               = require('joi');
let   _encryptedFields  = [];
let   _compressedFields = [];

const extendedJoi = Joi
    .extend((joi) => ({
        type: 'string',
        base: joi.string(),
        rules: {
            encrypt: {
                args: [],
                validate(value, helpers, args, options) {
                    _encryptedFields.push(helpers.state.path.join('.'));
                    return value;
                },
            },
            compress: {
                args: [],
                validate(value, helpers, args, options) {
                    _compressedFields.push(helpers.state.path.join('.'));
                    return value;
                },
            },
        },
        coerce(value, helpers) {
            if (Buffer.isBuffer(value)) {
                return { value: value.toString('base64') };
            }
            return { value };
        },
    }))
    .extend((joi) => ({
        type: 'number',
        base: joi.number(),
        rules: {
            encrypt: {
                args: [],
                validate(value, helpers, args, options) {
                    _encryptedFields.push(helpers.state.path.join('.'));
                    return value;
                },
            },
            compress: {
                args: [],
                validate(value, helpers, args, options) {
                    _compressedFields.push(helpers.state.path.join('.'));
                    return value;
                },
            },
        },
        coerce(value, helpers) {
            if (Buffer.isBuffer(value)) {
                return { value: value.toString('base64') };
            }
            return { value };
        },
    }))
    .extend((joi) => ({
        type: 'arrayCompress',
        base: joi.array(),
        rules: {
            encrypt: {
                args: [],
                validate(value, helpers, args, options) {
                    console.log('@@@ VALIDATE ENCRYPT')
                    _encryptedFields.push(helpers.state.path.join('.'));
                    return value;
                },
                // method() {
                //     console.log('@@@ AHH')
                // }
            },
            compress: {
                args: [],
                // validate(value, helpers, args, options) {
                //     console.log('@@@ VALIDATE COMPRESS')
                //     _compressedFields.push(helpers.state.path.join('.'));
                //     return value;
                // },
                method() {
                    console.log('@@ Adding flag method')
                    return this.$_setFlag('compressed', true);
                }
            },
        },
        coerce(value, helpers) {
            if (Buffer.isBuffer(value)) {
                return { value: value.toString('base64') };
            }
            return { value };
        },
        validate(value, helpers) {
            console.log('@@ Checking flag')
            // console.log(helpers.schema);
            console.log(helpers);
            if (helpers.schema.$_getFlag('compressed')) {
                console.log('@@ flag exists')
                _compressedFields.push(helpers.state.path.join('.'));
            }
            return { value };
        }
    }));

const validate = (value, schema, options, cb) => {
    if(typeof(options) == 'function') {
        cb = options;
        options = null;
    }

    _encryptedFields  = [];
    _compressedFields = [];
    let result = schema.validate(value, options);
    result.encryptedFields  = _encryptedFields;
    result.compressedFields = _compressedFields;
    
    if(typeof(cb) == 'function') {
        cb(result.error, result.value, result.encryptedFields, result.compressedFields);
    }else {
        return result;
    }
};

extendedJoi.validate = validate;

extendedJoi.useCompression = (schema) => {
    return (value, helpers) => {
        _compressedFields.push(helpers.state.path.join('.'));
        if (Buffer.isBuffer(value)) {
            return { value };
        }
        const result = schema.validate(value);
        if (result.error) {
            throw result.error;
        }
        return { value };
    };
};

extendedJoi.useEncryption = (schema) => {
    return (value, helpers) => {
        _encryptedFields.push(helpers.state.path.join('.'));
        if (Buffer.isBuffer(value)) {
            return { value };
        }
        const result = schema.validate(value);
        if (result.error) {
            throw result.error;
        }
        return { value };
    };
};

extendedJoi.useCompressedEncryption = (schema) => {
    return (value, helpers) => {
        _compressedFields.push(helpers.state.path.join('.'));
        _encryptedFields.push(helpers.state.path.join('.'));
        if (Buffer.isBuffer(value)) {
            return { value };
        }
        const result = schema.validate(value);
        if (result.error) {
            throw result.error;
        }
        return { value };
    };
};

module.exports = extendedJoi;

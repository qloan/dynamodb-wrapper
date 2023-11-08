const Joi               = require('joi');
let   _encryptedFields  = [];
let   _compressedFields = [];

const extendedJoi = Joi.extend((joi) => ({
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
        type: 'array',
        base: joi.array(),
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

extendedJoi.validate = (value, schema, options, cb) => {
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

module.exports = extendedJoi;
const Joi               = require('joi');
let   _encryptedFields  = [];
let   _compressedFields = [];

const extendedJoi = Joi;

/* The below is probably joi 17 specific, but wasn't sure how else to do this.
 * Issue being solved is that: If a joi.string() is/is-not required and I use joi.useCompression(),
 * the resulting schema needs to retain that property.
 * If you can refactor and get the joicrypt.spec.js tests to pass without modifying them,
 * your solution should be solid.
 */ 
const hasRequiredFlag = schema => schema?._flags?.presence === 'required';

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

extendedJoi.useCompression = (schema) => {
    let newSchema = Joi.alternatives().try(
        schema,
        Joi.binary().required()
    ).custom((value, helpers) => {
        if (value) {
            _compressedFields.push(helpers.state.path.join('.'));
        }
        return { value };
    });
    if (hasRequiredFlag(schema)) {
        newSchema = newSchema.required();
    }
    return newSchema;
};

extendedJoi.useEncryption = (schema) => {
    const isRequired = schema?._flags?.presence === 'required';
    let newSchema = Joi.alternatives().try(
        schema,
        Joi.binary().required()
    ).custom((value, helpers) => {
        if (value) {
            _encryptedFields.push(helpers.state.path.join('.'));
        }
        return { value };
    });
    if (hasRequiredFlag(schema)) {
        newSchema = newSchema.required();
    }
    return newSchema;
}

extendedJoi.useCompressedEncryption = (schema) => {
    const isRequired = schema?._flags?.presence === 'required';
    let newSchema = Joi.alternatives().try(
        schema,
        Joi.binary().required()
    ).custom((value, helpers) => {
        if (value) {
            _compressedFields.push(helpers.state.path.join('.'));
            _encryptedFields.push(helpers.state.path.join('.'));
        }
        return { value };
    });
    if (hasRequiredFlag(schema)) {
        newSchema = newSchema.required();
    }
    return newSchema;
}

module.exports = extendedJoi;

const joi              = require('joi');
let   _encryptedFields = [];

let extendedJoi = joi.extend({
   base: joi.string(),
   name: 'string',
   pre(value, state, options) {
       if(this._flags.encrypt) {
           _encryptedFields.push(state.path);
       }
       return value;
   },
   rules: [{
       name: 'encrypt',
       setup(params) {
           this._flags.encrypt = true;
       }
   }]
}, {
   base: joi.number(),
   name: 'number',
   pre(value, state, options) {
       if(this._flags.encrypt) {
           _encryptedFields.push(state.path);
       }
       return value;
   },
   rules: [{
       name: 'encrypt',
       setup(params) {
           this._flags.encrypt = true;
       }
   }]
});

extendedJoi._validate = extendedJoi.validate;

extendedJoi.validate = (value, schema, options, cb) => {
    if(typeof(options) == 'function') {
        cb = options;
        options = null;
    }

    _encryptedFields = [];
    let result = extendedJoi._validate(value, schema, options);
    result.encryptedFields = _encryptedFields;

    if(typeof(cb) == 'function') {
        cb(result.error, result.value, result.encryptedFields);
    }else {
        return result;
    }
};

module.exports = extendedJoi;

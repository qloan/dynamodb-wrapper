const joi               = require('joi');
let   _encryptedFields  = [];
let   _compressedFields = [];

let extendedJoi = joi.extend({
   base: joi.string(),
   name: 'string',
   pre(value, state, options) {
       if(this._flags.compress || this._flags.encrypt) {
           if(this._flags.compress) {
               _compressedFields.push(state.path);
           }
           if(this._flags.encrypt) {
               _encryptedFields.push(state.path);
           }
       }else if(this._flags.isBuffer) {
           value = Buffer.from(value, 'base64');
       }
       return value;
   },
   coerce(value, state, options) {
       if(Buffer.isBuffer(value)) {
           this._flags.isBuffer = true;
           return value.toString('base64');
       }

       return value;
   },
   rules: [{
       name: 'encrypt',
       setup(params) {
           this._flags.encrypt = true;
       }
   }, {
       name: 'compress',
       setup(params) {
           this._flags.compress = true;
       }
   }]
}, {
   base: joi.number(),
   name: 'number',
   pre(value, state, options) {
       if(this._flags.compress || this._flags.encrypt) {
           if (this._flags.compress && !_compressedFields.includes(state.path)) {
                _compressedFields.push(state.path);
            }
           if(this._flags.encrypt) {
               _encryptedFields.push(state.path);
           }
       }
       return value;
   },
   coerce(value, state, options) {
       if(Buffer.isBuffer(value)) {
           _compressedFields.push(state.path);
       }
       return value;
   },
   rules: [{
       name: 'encrypt',
       setup(params) {
           this._flags.encrypt = true;
       }
   }, {
       name: 'compress',
       setup(params) {
           this._flags.compress = true;
       }
   }]
}, {
   base: joi.array(),
   name: 'array',
   pre(value, state, options) {
       if(this._flags.compress || this._flags.encrypt) {
            if (this._flags.compress && !_compressedFields.includes(state.path)) {
                _compressedFields.push(state.path);
            }
           if(this._flags.encrypt) {
               _encryptedFields.push(state.path);
           }
       }
       return value;
   },
   coerce(value, state, options) {
       if(Buffer.isBuffer(value)) {
           _compressedFields.push(state.path);
       }

       return value;
   },
   rules: [{
       name: 'encrypt',
       setup(params) {
           this._flags.encrypt = true;
       }
   }, {
       name: 'compress',
       setup(params) {
           this._flags.compress = true;
       }
   }]
});

extendedJoi._validate = extendedJoi.validate;

extendedJoi.validate = (value, schema, options, cb) => {
    if(typeof(options) == 'function') {
        cb = options;
        options = null;
    }

    _encryptedFields  = [];
    _compressedFields = [];
    let result = extendedJoi._validate(value, schema, options);
    result.encryptedFields  = _encryptedFields;
    result.compressedFields = _compressedFields;
    
    if(typeof(cb) == 'function') {
        cb(result.error, result.value, result.encryptedFields, result.compressedFields);
    }else {
        return result;
    }
};

module.exports = extendedJoi;

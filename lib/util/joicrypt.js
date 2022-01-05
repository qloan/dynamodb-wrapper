const joi               = require('joi');
let   _encryptedFields  = [];
let   _compressedFields = [];

let extendedJoi = joi.extend({
   base: joi.string(),
   type: 'string',
   prepare(value, state, options) {
       if(this.$_getFlag('compress') || this.$_getFlag('encrypt')) {
           if(this.$_getFlag('compress')) {
               _compressedFields.push(state.path);
           }
           if(this.$_getFlag('encrypt')) {
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
   rules: {
    encrypt: {
        method() {
         return this.$_setFlag('encrypt', true);
        }
    },
    compress: {
     method() {
         return this.$_setFlag('compress', true);
        }
    }
}
}, {
   base: joi.number(),
   type: 'number',
   prepare(value, state, options) {
       if(this.$_getFlag('compress') || this.$_getFlag('encrypt')) {
           if (this.$_getFlag('compress') && !_compressedFields.includes(state.path)) {
                _compressedFields.push(state.path);
            }
           if(this.$_getFlag('encrypt')) {
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
   rules: {
    encrypt: {
        method() {
         return this.$_setFlag('encrypt', true);
        }
    },
    compress: {
     method() {
         return this.$_setFlag('compress', true);
        }
    }
}
}, {
   base: joi.array(),
   type: 'array',
   prepare(value, state, options) {
       if(this.$_getFlag('compress') || this.$_getFlag('encrypt')) {
            if (this.$_getFlag('compress') && !_compressedFields.includes(state.path)) {
                _compressedFields.push(state.path);
            }
           if(this.$_getFlag('encrypt')) {
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
   rules: {
       encrypt: {
           method() {
            return this.$_setFlag('encrypt', true);
           }
       },
       compress: {
        method() {
            return this.$_setFlag('compress', true);
           }
       }
   }
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

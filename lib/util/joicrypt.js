const joi               = require('joi');
let   _encryptedFields  = [];
let   _compressedFields = [];

let extendedJoi = joi.extend({
   base: joi.string(),
   type: 'string',
   prepare(value, helpers) {
       if(helpers.schema.$_getFlag('compress') || helpers.schema.$_getFlag('encrypt')) {
           if(helpers.schema.$_getFlag('compress')) {
               _compressedFields.push(helpers.state.path.join('.'));
           }
           if(helpers.schema.$_getFlag('encrypt')) {
               _encryptedFields.push(helpers.state.path.join('.'));
           }
       }else if(helpers.schema.$_getFlag('isBuffer')) {
           value = Buffer.from(value, 'base64');
       }
       return { value };
   },
   coerce(value) {
       if(Buffer.isBuffer(value)) {
           this._setFlag('isBuffer', true);
           return { value: value.toString('base64') };
       }
       return { value };
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
   prepare(value, helpers, options) {
       if(helpers.schema.$_getFlag('compress') || helpers.schema.$_getFlag('encrypt')) {
           if (helpers.schema.$_getFlag('compress') && !_compressedFields.includes(helpers.state.path.join('.'))) {
                _compressedFields.push(helpers.state.path.join('.'));
            }
           if(helpers.schema.$_getFlag('encrypt')) {
               _encryptedFields.push(helpers.state.path.join('.'));
           }
       }
       return { value };
   },
   coerce(value, helpers) {
       if(Buffer.isBuffer(value)) {
           _compressedFields.push(helpers.state.path.join('.'));
       }
       return { value };
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
   prepare(value, helpers) {
       if(helpers.schema.$_getFlag('compress') || helpers.schema.$_getFlag('encrypt')) {
            if (helpers.schema.$_getFlag('compress') && !_compressedFields.includes(helpers.state.path.join('.'))) {
                _compressedFields.push(helpers.state.path.join('.'));
            }
           if(helpers.schema.$_getFlag('encrypt')) {
               _encryptedFields.push(helpers.state.path.join('.'));
           }
       }
       return { value };
   },
   coerce(value, helpers) {
       if(Buffer.isBuffer(value)) {
           _compressedFields.push(helpers.state.path.join('.'));
       }

       return { value };
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

extendedJoi.decorateSchema = (schema) => {
    schema._validate = schema.validate;

    schema.validate = (value, options, cb) => {
        if(typeof(options) == 'function') {
            cb = options;
            options = null;
        }

        _encryptedFields  = [];
        _compressedFields = [];
        let result = schema._validate(value, options);
        result.encryptedFields  = _encryptedFields;
        result.compressedFields = _compressedFields;
        
        if(typeof(cb) == 'function') {
            cb(result.error, result.value, result.encryptedFields, result.compressedFields);
        } else {
            return result;
        }
    };

    return schema;
}

module.exports = extendedJoi;

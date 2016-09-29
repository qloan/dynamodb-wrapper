const   joi            = require('joi');
const _buildType       = Symbol();
const _encryptedFields = Symbol();

class JoiCrypt {
    constructor() {
        this.joi = joi.extend(this[_buildType]('string'), this[_buildType]('number'));
        this[_encryptedFields] = [];
    }

    validate(...args) {
        this[_encryptedFields] = [];
        this.joi.validate.apply(this.joi, args);
    }

    getEncryptedFields() {
        return this[_encryptedFields];
    }

    [_buildType](name) {
        let _this = this;

        return {
           base: joi[name](),
           name: name,
           pre(value, state, options) {
               if(this._flags.encrypt) {
                   _this[_encryptedFields].push(state.path);
               }
               return value;
           },
           rules: [{
               name: 'encrypt',
               setup(params) {
                   this._flags.encrypt = true;
               }
           }]
       };
    }
}

module.exports = JoiCrypt;

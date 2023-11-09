const joi    = require('lib/util/joicrypt');
const chai   = require('chai');
const expect = chai.expect;
const assert = chai.assert;

describe('JoiCrypt', () => {
    it('Should be able to detect encrypted fields', () => {
        const schema = joi.object().keys({
            ssn : joi.useEncryption(joi.string().required())
        });
        const obj = {
            ssn: '5'
        };
        const result = joi.validate(obj, schema);
        assert(!result.error, 'There should not be an error');
        expect(result.encryptedFields).to.deep.equal(['ssn']);
    });
    it('Encrypted fields should be able to fail validation, due to wrong type', () => {
        const schema = joi.object().keys({
            ssn : joi.useEncryption(joi.string().required())
        });
        const obj = {
            ssn: 5
        };
        const result = joi.validate(obj, schema);
        assert(result.error, 'There should be an error');
    });
    it('Encrypted fields should be able to fail validation, due to being missing', () => {
        const schema = joi.object().keys({
            ssn : joi.useEncryption(joi.string().required())
        });
        const obj = {};
        const result = joi.validate(obj, schema);
        assert(result.error, 'There should be an error');
    });
    it('Should be able to detect compressed fields', () => {
        const schema = joi.object().keys({
            ssn : joi.useCompression(joi.string().required())
        });
        const obj = {
            ssn: '5'
        };
        const result = joi.validate(obj, schema);
        assert(!result.error, 'There should not be an error');
        expect(result.compressedFields).to.deep.equal(['ssn']);
    });
    it('Compressed fields should be able to fail validation, due to wrong type', () => {
        const schema = joi.object().keys({
            ssn : joi.useCompression(joi.string().required())
        });
        const obj = {
            ssn: 5
        };
        const result = joi.validate(obj, schema);
        assert(result.error, 'There should be an error');
    });
    it('Compressed fields should be able to fail validation, due to being missing', () => {
        const schema = joi.object().keys({
            ssn : joi.useCompression(joi.string().required())
        });
        const obj = {};
        const result = joi.validate(obj, schema);
        assert(result.error, 'There should be an error');
    });
    it('Should be able to detect compressed+encrypted fields', () => {
        const schema = joi.object().keys({
            ssn : joi.useCompressedEncryption(joi.string().required())
        });
        const obj = {
            ssn: '5'
        };
        const result = joi.validate(obj, schema);
        assert(!result.error, 'There should not be an error');
        expect(result.encryptedFields).to.deep.equal(['ssn']);
        expect(result.compressedFields).to.deep.equal(['ssn']);
    });
    it('Compressed+Encrypted fields should be able to fail validation, due to wrong type', () => {
        const schema = joi.object().keys({
            ssn : joi.useCompressedEncryption(joi.string().required())
        });
        const obj = {
            ssn: 5
        };
        const result = joi.validate(obj, schema);
        assert(result.error, 'There should be an error');
    });
    it('Compressed+Encrypted fields should be able to fail validation, due to being missing', () => {
        const schema = joi.object().keys({
            ssn : joi.useCompressedEncryption(joi.string().required())
        });
        const obj = {};
        const result = joi.validate(obj, schema);
        assert(result.error, 'There should be an error');
    });
    it('Should be able to detect nested fields', function() {
        const schema = joi.object().keys({
            a : {
                b: {
                    c: joi.useCompressedEncryption(joi.string().required())
                }
            },
        });
        const obj = {
            a: {
                b: {
                    c: '5'
                }
            }
        };
        const result = joi.validate(obj, schema);
        assert(!result.error, 'There should not be an error');
        expect(result.encryptedFields).to.deep.equal(['a.b.c']);
        expect(result.compressedFields).to.deep.equal(['a.b.c']);
    });
    it('Even if a buffer is passed in for an encrypted field, we should still be able to detect that its encrypted so we can decrypt it', () => {
        const schema = joi.object().keys({
            ssn : joi.useEncryption(joi.string().required())
        });
        const obj = {
            ssn: Buffer.from('5')
        };
        const result = joi.validate(obj, schema, { abortEarly: false });
        expect(result.encryptedFields).to.deep.equal(['ssn']);
    });
    it('Even if a buffer is passed in for an compressed field, we should still be able to detect that its compressed so we can decompress it', () => {
        const schema = joi.object().keys({
            ssn : joi.useCompression(joi.string().required())
        });
        const obj = {
            ssn: Buffer.from('5')
        };
        const result = joi.validate(obj, schema, { abortEarly: false });
        console.log(result.error);
        expect(result.compressedFields).to.deep.equal(['ssn']);
    });
    it('Should be able to compress arrays', () => {
        const schema = joi.object().keys({
            arr : joi.useCompression(joi.array().items(joi.object().keys({
                a: true
            })))
        });
        const obj = {
            arr: [{ a: true }, { a: true }]
        };
        const result = joi.validate(obj, schema);
        assert(!result.error, 'There should not be an error');
        expect(result.compressedFields).to.deep.equal(['arr']);
    });
    it('Should be able to detect validation errors on compressed arrays', () => {
        const schema = joi.object().keys({
            arr : joi.useCompression(joi.array().items(joi.object().keys({
                a: true
            })))
        });
        const obj = {
            arr: [{ b: true }, { a: true }]
        };
        const result = joi.validate(obj, schema);
        assert(result.error, 'There should be an error');
    });

    it('should pass validation', () => {
        const schema = joi.object().keys({
            loanId : joi.string().required(),
            foo    : joi.string().required(),
            personalInformation : joi.object().keys({
                firstName  : joi.useEncryption(joi.string().required()),
                middleName : joi.useCompression(joi.string()),
                lastName   : joi.useEncryption(joi.string()),
                ssn        : joi.useCompressedEncryption(joi.string())
            }),
            arrFields : joi.array().required().items(joi.object().keys({
                field1 : joi.number(),
                field2 : joi.useEncryption(joi.number()),
                field3 : joi.useCompression(joi.string()),
                field4 : joi.useCompressedEncryption(joi.string())
            }))
        });
        const obj = {
            loanId : '12345',
            foo    : 'test',
            arrFields: [{
                field1: 9,
                field2: 12
            }, {
                field1: 42,
                field2: 21
            }]
        };
        const result = joi.validate(obj, schema);
        assert(!result.error, 'There should not be an error');
    });

    it('should properly determine compressed and encrypted fields when validation passes', () => {
        const schema = joi.object().keys({
            loanId : joi.string().required(),
            foo    : joi.string().required(),
            personalInformation : joi.object().keys({
                firstName  : joi.useEncryption(joi.string().required()),
                middleName : joi.useCompression(joi.string()),
                lastName   : joi.useEncryption(joi.string()),
                ssn        : joi.useCompressedEncryption(joi.string())
            }),
            arrFields : joi.array().required().items(joi.object().keys({
                field1 : joi.number(),
                field2 : joi.useEncryption(joi.number()),
                field3 : joi.useCompression(joi.string()),
                field4 : joi.useCompressedEncryption(joi.string())
            }))
        });
        const obj = {
            loanId : '12345',
            foo    : 'test',
            arrFields: [{
                field1: 9,
                field2: 53,
                field3: 'this is a test'
            }, {
                field1: 42,
                field2: 55,
                field4: 'yet another test'
            }]
        };
        const result = joi.validate(obj, schema);
        expect(result.encryptedFields).to.deep.equal([
            'arrFields.0.field2',
            'arrFields.1.field2',
            'arrFields.1.field4'
        ]);

        expect(result.compressedFields).to.deep.equal([
            'arrFields.0.field3',
            'arrFields.1.field4'
        ]);
    });

    it('should properly determine encrypted fields when validation passes #2', () => {
        const schema = joi.object().keys({
            loanId : joi.string().required(),
            foo    : joi.string().required(),
            personalInformation : joi.object().keys({
                firstName  : joi.useEncryption(joi.string().required()),
                middleName : joi.useCompression(joi.string()),
                lastName   : joi.useEncryption(joi.string()),
                ssn        : joi.useCompressedEncryption(joi.string())
            }),
            arrFields : joi.array().required().items(joi.object().keys({
                field1 : joi.number(),
                field2 : joi.useEncryption(joi.number()),
                field3 : joi.useCompression(joi.string()),
                field4 : joi.useCompressedEncryption(joi.string())
            }))
        });
        const obj = {
            loanId : '12345',
            foo    : 'test',
            personalInformation: {
                firstName  : 'John',
                middleName : 'Michael',
                lastName   : 'Smith',
                ssn        : '123456789'
            },
            arrFields: [{
                field1: 9,
                field2: 19
            }, {
                field1: 42,
                field2: 88
            }]
        };
        const result = joi.validate(obj, schema);
        expect(result.encryptedFields).to.deep.equal([
            'personalInformation.firstName',
            'personalInformation.lastName',
            'personalInformation.ssn',
            'arrFields.0.field2',
            'arrFields.1.field2'
        ]);
        expect(result.compressedFields).to.deep.equal([
            'personalInformation.middleName',
            'personalInformation.ssn'
        ]);
    });

    it('should properly determine all encrypted fields, even if validation fails', () => {
        const schema = joi.object().keys({
            loanId : joi.string().required(),
            foo    : joi.string().required(),
            personalInformation : joi.object().keys({
                firstName  : joi.useEncryption(joi.string().required()),
                middleName : joi.useCompression(joi.string()),
                lastName   : joi.useEncryption(joi.string()),
                ssn        : joi.useCompressedEncryption(joi.string())
            }),
            arrFields : joi.array().required().items(joi.object().keys({
                field1 : joi.number(),
                field2 : joi.useEncryption(joi.number()),
                field3 : joi.useCompression(joi.string()),
                field4 : joi.useCompressedEncryption(joi.string())
            }))
        });
        const obj = {
            loanId : 12345,
            foo    : 'test',
            personalInformation: {
                firstName  : 'John',
                middleName : 'Michael',
                lastName   : 'Smith',
                ssn        : '123456789'
            },
            arrFields: [{
                field1: 9,
                field2: 2,
                field3: 'test test'
            }, {
                field1: 42,
                field2: 55,
                field4: 'yet another test'
            }]
        };

        let result = joi.validate(obj, schema);
        expect(result.error.name).to.equal('ValidationError');

        result = joi.validate(obj, schema, {abortEarly: false});
        expect(result.error.name).to.equal('ValidationError');
        expect(result.encryptedFields).to.deep.equal([
            'personalInformation.firstName',
            'personalInformation.lastName',
            'personalInformation.ssn',
            'arrFields.0.field2',
            'arrFields.1.field2',
            'arrFields.1.field4'
        ]);
        expect(result.compressedFields).to.deep.equal([
            'personalInformation.middleName',
            'personalInformation.ssn',
            'arrFields.0.field3',
            'arrFields.1.field4',
        ]);
    });

    it('should be able to compress an array', () => {
        const schema = joi.object().keys({
            loanId : joi.string().required(),
            foo    : joi.string().required(),
            personalInformation : joi.object().keys({
                firstName  : joi.useEncryption(joi.string().required()),
                middleName : joi.useCompression(joi.string()),
                lastName   : joi.useEncryption(joi.string()),
                ssn        : joi.useCompressedEncryption(joi.string())
            }),
            arrFields : joi.array().required().items(joi.object().keys({
                field1 : joi.number(),
                field2 : joi.useEncryption(joi.number()),
                field3 : joi.useCompression(joi.string()),
                field4 : joi.useCompressedEncryption(joi.string())
            }))
        });
        const obj = {
            loanId : 12345,
            foo    : 'test',
            personalInformation: {
                firstName  : 'John',
                middleName : 'Michael',
                lastName   : 'Smith',
                ssn        : '123456789'
            },
            arrFields: [{
                field1: 9,
                field2: 2,
                field3: 'test test'
            }, {
                field1: 42,
                field2: 55,
                field4: 'yet another test'
            }]
        };

        let result = joi.validate(obj, schema);
        expect(result.error.name).to.equal('ValidationError');
        expect(result.encryptedFields).to.deep.equal([]);

        result = joi.validate(obj, schema, {abortEarly: false});
        expect(result.error.name).to.equal('ValidationError');
        expect(result.encryptedFields).to.deep.equal([
            'personalInformation.firstName',
            'personalInformation.lastName',
            'personalInformation.ssn',
            'arrFields.0.field2',
            'arrFields.1.field2',
            'arrFields.1.field4'
        ]);
        expect(result.compressedFields).to.deep.equal([
            'personalInformation.middleName',
            'personalInformation.ssn',
            'arrFields.0.field3',
            'arrFields.1.field4',
        ]);
    });
});

const joi    = require('lib/util/joicrypt');
const chai   = require('chai');
const expect = chai.expect;
const assert = chai.assert;

const obj = joi.object();
const arr = joi.array();
const str = joi.string();
const num = joi.number();

const schema = obj.keys({
    loanId : str.required(),
    foo    : str.required(),
    personalInformation : obj.keys({
        firstName  : str.required().encrypt(),
        middleName : str,
        lastName   : str.encrypt(),
        ssn        : joi.custom(joi.useCompressedEncryption(str)),
    }),
    arrFields : arr.required().items(obj.keys({
        field1 : num,
        field2 : num.encrypt(),
        field3 : str.compress(),
        field4 : str.compress().encrypt()
    })),
    arrComp : joi.custom(
        joi.useCompression(joi.array().items(joi.string()))
    )
});

describe('JoiCrypt', () => {

    it('should fail validation', (done) => {
        const obj = {
                loanId: '12345'
        };
        const result = joi.validate(obj, schema);
        expect(result.error.name).to.equal('ValidationError');
        done();
    });

    it('should pass validation', (done) => {
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
        done();
    });

    it('should properly determine compressed and encrypted fields when validation passes', (done) => {
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
        done();
    });

    it('should properly determine encrypted fields when validation passes #2', (done) => {
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
            'personalInformation.ssn'
        ]);
        done();
    });

    it('should properly determine all encrypted fields, even if validation fails', (done) => {
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
            'personalInformation.ssn',
            'arrFields.0.field3',
            'arrFields.1.field4',
        ]);
        done();
    });

    // search note: NOTE_IGNORE_ERROR_ENCRYPT_COMPRESSED
    it('Should not throw an error if validating a buffer, but should recognize compressed field', (done) => {
        const obj = {
            loanId : '12345',
            foo    : 'test',
            arrFields: [],
            arrComp: Buffer.from('asd')
        };

        const result = joi.validate(obj, schema, {abortEarly: false}); 
        assert(!result.error, 'Should not throw an error');
        expect(result.compressedFields).to.deep.equal([ 'arrComp' ]);
        done();
    });
    it('Should throw an error if validating something that doesnt match the schema which isnt a buffer', (done) => {
        const obj = {
            loanId : '12345',
            foo    : 'test',
            arrFields: [],
            arrComp: [1]
        };

        const result = joi.validate(obj, schema, {abortEarly: false}); 
        assert(result.error, 'Should throw an error');
        done();
    });
    it('If validating something that matches the schema, should not throw an error and should record the compressed field', (done) => {
        const obj = {
            loanId : '12345',
            foo    : 'test',
            arrFields: [],
            arrComp: ['a']
        };

        const result = joi.validate(obj, schema, {abortEarly: false}); 
        assert(!result.error, 'Should not throw an error');
        expect(result.compressedFields).to.deep.equal([ 'arrComp' ]);
        done();
    });
    it('If the field isnt present, shouldnt be considered a compressed field', (done) => {
        const obj = {
            loanId : '12345',
            foo    : 'test',
            arrFields: []
        };

        const result = joi.validate(obj, schema, {abortEarly: false}); 
        assert(!result.error, 'Should not throw an error');
        expect(result.compressedFields).to.deep.equal([]);
        done();
    });
    it('t again', (done) => {
        const obj = {
            loanId : '12345',
            foo    : 'test',
            arrFields: [],
            personalInformation : {
                firstName  : 'a',
                ssn        : 'd'
            },
        };

        const result = joi.validate(obj, schema, {abortEarly: false}); 
        assert(!result.error, 'Should not throw an error');
        expect(result.compressedFields).to.deep.equal([
            'personalInformation.ssn',
        ]);
        expect(result.encryptedFields).to.deep.equal([
            'personalInformation.firstName',
            'personalInformation.ssn',
        ]);
        done();
    });
});

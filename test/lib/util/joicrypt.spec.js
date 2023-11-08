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
        middleName : str.compress(),
        lastName   : str.encrypt(),
        ssn        : str.compress().encrypt()
    }),
    arrFields : arr.required().items(obj.keys({
        field1 : num,
        field2 : num.encrypt(),
        field3 : str.compress(),
        field4 : str.compress().encrypt()
    }))
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
            'personalInformation.middleName',
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
            'personalInformation.middleName',
            'personalInformation.ssn',
            'arrFields.0.field3',
            'arrFields.1.field4',
        ]);
        done();
    });
});

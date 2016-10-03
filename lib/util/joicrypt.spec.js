const joi    = require('./joicrypt');
const chai   = require('chai');
const expect = chai.expect;
const assert = chai.assertd;

const obj = joi.object();
const arr = joi.array();
const str = joi.string();
const num = joi.number();

const schema = obj.keys({
    loanId : str.required(),
    foo    : str.required(),
    personalInformation : obj.keys({
        firstName : str.required().encrypt(),
        lastName  : str.encrypt()
    }),
    arrFields : arr.required().items(obj.keys({
        field1 : num,
        field2 : str.encrypt()
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
                field2: 'test'
            }, {
                field1: 42,
                field2: 'another test'
            }]
        };
        const result = joi.validate(obj, schema);
        expect(result.error).to.be.null;
        done();
    });

    it('should properly determine encrypted fields when validation passes', (done) => {
        const obj = {
            loanId : '12345',
            foo    : 'test',
            arrFields: [{
                field1: 9,
                field2: 'test'
            }, {
                field1: 42,
                field2: 'another test'
            }]
        };
        const result = joi.validate(obj, schema);
        expect(result.encryptedFields).to.deep.equal(['arrFields.0.field2', 'arrFields.1.field2']);
        done();
    });

    it('should properly determine encrypted fields when validation passes #2', (done) => {
        const obj = {
            loanId : '12345',
            foo    : 'test',
            personalInformation: {
                firstName: 'John',
                lastName: 'Smith'
            },
            arrFields: [{
                field1: 9,
                field2: 'test'
            }, {
                field1: 42,
                field2: 'another test'
            }]
        };
        const result = joi.validate(obj, schema);
        expect(result.encryptedFields).to.deep.equal(['personalInformation.firstName', 'personalInformation.lastName', 'arrFields.0.field2', 'arrFields.1.field2']);
        done();
    });
});

const DB       = require('../../lib');
let joi        = DB.joi;
let LoanSchema = DB.schema({
    region: 'us-west-2'
});

/* Hooks which operate on the plain json of the items would be defined in this file */

module.exports = new LoanSchema({
    tableName: 'dev-dsmith11-loans',
    key: {
        hash: 'loanId'
    },
    schema: {
        loanId : joi.string().required(),
        personalInformation : joi.object().keys({
            firstName : joi.string().encrypt(),
            lastName  : joi.string().encrypt()
        }),
        foo    : joi.string().required()
    }
});

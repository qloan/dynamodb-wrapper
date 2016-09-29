var joi = require("joi");
var Schema = require('../../lib/schema')({
    region: 'us-west-2'
});

/* Hooks which operate on the plain json of the items would be defined in this file */

module.exports = new Schema({
    tableName: 'dev-dsmith11-loans',
    key: {
        hash: 'loanId'
    },
    schema: {
        loanId: joi.string().required(),
        foo: joi.string().required()
    }
});
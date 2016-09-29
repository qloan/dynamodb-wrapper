/* Put the schema in its own file because it gets huge */
var joi = require("joi");
module.exports = {
    loanId: joi.string().required(),
    foo: joi.string().required()
};
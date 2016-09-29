var joi = require("joi");
module.exports = {
    loanId: joi.string().required(),
    foo: joi.string().required()
};
var Item = require("../../lib/item");
var joi = require('joi');
var async = require('async');
class Loan extends Item {
    constructor(json) {
        super({
            attrs: json,
            model: require("./LoanTable")
        });
    }
}
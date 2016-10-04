var Item = require("../../lib").item;
var joi = require('joi');
var async = require('async');

/* require this file if you already have the json of the database item (So basically in the onboard route only, when we create the loan object) */
/* Hooks which operate using extensions could be defined in this file. */
class LoanItem extends Item {
    constructor(json) {
        super({
            attrs: json,
            schema: require("./schema")
        });
    }
    // Extensions are just functions
    getFoo(foo) {
        return 'Hello, ' + "foo" + '!';
    }
}

module.exports = LoanItem;

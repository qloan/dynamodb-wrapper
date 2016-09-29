var Item = require("../../lib/item");
var joi = require('joi');
var async = require('async');
/* Hooks would get defined in this file I think */
class Loan extends Item {
    constructor(json) {
        super({
            attrs: json,
            model: require("./TableDefinition"),
            itemConstructor: Loan
        });
    }
    // Extensions are just functions
    getFoo(foo) {
        return 'Hi, ' + "foo" + '!';
    }
}
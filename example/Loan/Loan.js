var Item = require("../../lib/item");
var joi = require('joi');
var async = require('async');
/* Hooks which operate using extensions could be defined in this file. */
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
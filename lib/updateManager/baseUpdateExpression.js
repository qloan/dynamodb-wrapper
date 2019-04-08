const _ = require('lodash');
const util = require('../util/util')
class BaseUpdateExpression {
    constructor() {
        this.commands = [];
    }
    build() {
        for (var i = 0; i < this.commands.length; i++) {
            this.applyCommand(this.commands[i]);
        }
    }
    constructCommand(action, field, value) {
        this.commands.push({
            action: action,
            field: field,
            value: value ? util.clone(value) : value
        });
    }
    applyCommand(command) {
        switch(command.action) {
        case "SET":
            return this.performSet(command);
        case "ADD":
            return this.performAdd(command);
        case "APPEND":
            return this.performAppend(command);
        case "REMOVE":
            return this.performRemove(command);
        }
    }
}

module.exports = BaseUpdateExpression;
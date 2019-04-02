const _              = require('lodash');
var BaseUpdateExpression = require("./baseUpdateExpression");
var reservedWords = require("./reservedWords");

class DynamoUpdateExpression extends BaseUpdateExpression{
    constructor() {
        super();
        this.resetExpressions();
    }
    build() {
        this.resetExpressions();
        super.build();
        var output = {
            UpdateExpression: this.createExpressionString(),
            ExpressionAttributeValues: this.expressionAttributeValues
        };
        if (Object.keys(this.expressionAttributeNames).length) {
            output.ExpressionAttributeNames = this.expressionAttributeNames;
        }
        return output;
    }
    performSet(command) {
        var valueIdentifier = this.recordValue(command);
        this.expressions.SET.push(`${this.getSafeField(command)} = ${valueIdentifier}`);
    }
    performAdd(command) {
        var zeroIdentifier = this.recordValue({value: 0});
        var valueIdentifier = this.recordValue(command);
        var field = this.getSafeField(command);
        this.expressions.SET.push(`${field} = if_not_exists ( ${field} , ${zeroIdentifier} ) + ${valueIdentifier}`);
    }
    performAppend(command) {
        command = _.cloneDeep(command);
        command.value = Array.isArray(command.value) ? command.value : [command.value];
        var emptyListIdentifier = this.recordValue({value: []});
        var appendedItemIdentifier = this.recordValue(command);
        var field = this.getSafeField(command);
        this.expressions.SET.push(`${field} = list_append ( if_not_exists ( ${field} , ${emptyListIdentifier} ) , ${appendedItemIdentifier})`);
    }
    performRemove(command) {
        this.expressions.REMOVE.push(`${this.getSafeField(command)}`);
    }
    createExpressionString() {
        this.addExpressionString("SET");
        this.addExpressionString("REMOVE");
        return this.updateExpression.join(" ");
    }
    addExpressionString(expressionType) {
        var expressionString = this.createExpressionSubstring(expressionType);
        if (expressionString) {
            this.updateExpression.push(expressionString);
        }
    }
    createExpressionSubstring(expressionType) {
        return this.expressions[expressionType].length ?
            `${expressionType} ${this.expressions[expressionType].join(",")}` : false;
    }
    recordValue(command) {
        var identifier = this.createIdentifier(":");
        this.expressionAttributeValues[identifier] = command;
        return identifier;
    }
    createIdentifier(prefix) {
        return prefix + "TOKEN_" + this.uniqueIndex++;
    }
    getSafeField(command) {
        var field = command.field;
        if (!Array.isArray(command.field)) {
            field = field.split(".");
        }
        field = _.cloneDeep(field);
        for (var i = 0; i < field.length; i++) {
            if (this.needsAttributeName(field[i])) {
                field[i] = this.createExpressionAttributeName(field[i]);
            }
        }
        return field.join(".");
    }
    needsAttributeName(field) {
        return _.isFinite(parseFloat( field.charAt(0)))
            || field.indexOf(".") > -1
            || field.indexOf("-") > -1
            || reservedWords[field.toUpperCase()];
    }
    createExpressionAttributeName(field) {
        var identifier = this.createIdentifier("#");
        this.expressionAttributeNames[identifier] = field;
        return identifier;
    }
    resetExpressions() {
        this.uniqueIndex = 1;
        this.expressions = {SET: [], REMOVE: []};
        this.expressionAttributeNames = {};
        this.expressionAttributeValues = {};
        this.updateExpression = [];
    }
}

module.exports = DynamoUpdateExpression;

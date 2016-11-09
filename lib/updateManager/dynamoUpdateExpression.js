var rocketLoansSdk = require("rocketloans-sdk");
var BaseUpdateExpression = require("./baseUpdateExpression");
var util = rocketLoansSdk.util;

class DynamoUpdateExpression extends BaseUpdateExpression{
    constructor() {
        super();
        this.resetExpressions();
    }
    build() {
        this.resetExpressions();
        super.build();
        return {
            UpdateExpression: this.createExpressionString(),
            ExpressionAttributeValues: this.expressionAttributeValues,
            ExpressionAttributeNames: this.expressionAttributeNames
        };
    }
    performSet(command) {
        var valueIdentifier = this.recordValue(command);
        var field = this.getSafeField(command);
        this.expressions.SET.push(`${field} = ${valueIdentifier}`);
    }
    performAdd(command) {
        var zeroIdentifier = this.recordValue({value: 0});
        var valueIdentifier = this.recordValue(command);
        var field = this.getSafeField(command);
        this.expressions.SET.push(`${field} = if_not_exists ( ${field} , ${zeroIdentifier} ) + ${valueIdentifier}`);
    }
    performAppend(command) {
        command = util.clone(command);
        command.value = util.forceArray(command.value);
        var emptyListIdentifier = this.recordValue({value: []});
        var appendedItemIdentifier = this.recordValue(command);
        var field = this.getSafeField(command);
        this.expressions.SET.push(`${field} = list_append ( if_not_exists ( ${field} , ${emptyListIdentifier} ) , ${appendedItemIdentifier})`);
    }
    performRemove(command) {
        var field = this.getSafeField(command);
        this.expressions.REMOVE.push(`${field}`);
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
        for (var i = 0; i < field.length; i++) {
            if (this.needsAttributeName(field[i])) {
                field[i] = this.createExpressionAttributeName(field[i]);
            }
        }
        return field.join(".");
    }
    needsAttributeName(field) {
        return util.isNumeric(field.charAt(0))
            || field.indexOf(".") > -1
            || field.indexOf("-") > -1;
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

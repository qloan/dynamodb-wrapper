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
            ExpressionAttributeValues: this.expressionAttributeValues
        };
    }
    performSet(command) {
        var valueIdentifier = this.recordValue(command);
        this.expressions.SET.push(`${command.field} = ${valueIdentifier}`);
    }
    performAdd(command) {
        var valueIdentifier = this.recordValue(command);
        this.expressions.SET.push(`${command.field} = ${command.field} + ${valueIdentifier}`);
    }
    performAppend(command) {
        var valueIdentifier = this.recordValue(command);
        this.expressions.SET.push(`${command.field} = list_append(${command.field} , ${valueIdentifier})`);
    }
    performRemove(command) {
        this.expressions.REMOVE.push(`${command.field}`);
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
        var identifier = ":TOKEN_" + this.uniqueIndex++;
        this.expressionAttributeValues[identifier] = command.value;
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
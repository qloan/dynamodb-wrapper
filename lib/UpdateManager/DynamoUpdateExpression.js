var rocketLoansSdk = require("rocketloans-sdk");
var BaseUpdateExpression = require("./BaseUpdateExpression");
var util = rocketLoansSdk.util;

class DynamoUpdateExpression extends BaseUpdateExpression{
    constructor() {
        super();
        this.reset();
    }
    reset() {
        this.uniqueIndex = 1;
        super.reset();
    }
    resetExpressions() {
        this.expressions = {SET: [], REMOVE: []};
        this.expressionAttributeNames = {};
        this.expressionAttributeValues = {};
        this.updateExpression = "";
    }
    build() {
        this.resetExpressions();
        super.build();
        return {
            UpdateExpression: this.createExpressionString(),
            ExpressionAttributeValues: this.expressionAttributeValues
        };
    }
    createExpressionString() {
        return [
            this.createExpressionSubString("SET"),
            this.createExpressionSubString("REMOVE")
        ].join(" ");
    }
    createExpressionSubString(expressionType) {
        return this.expressions[expressionType].length ?
            `${expressionType} ${this.expressions[expressionType].join(",")}` : "";
    }
    recordValue(command) {
        var identifier = ":TOKEN" + this.uniqueIndex++;
        this.expressionAttributeValues[identifier] = command.value;
        return identifier;
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
}

module.exports = DynamoUpdateExpression;
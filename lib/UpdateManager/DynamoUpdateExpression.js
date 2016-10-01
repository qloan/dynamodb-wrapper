var rocketLoansSdk = require("rocketloans-sdk");
var UpdateExpression = require("./UpdateExpression");
var util = rocketLoansSdk.util;

class DynamoUpdateExpression extends UpdateExpression{
    constructor() {
        super();
        this.reset();
    }
    reset() {
        this.uniqueIndex = 1;
        this.expressions = {SET: [], REMOVE: []};
        this.expressionAttributeNames = {};
        this.expressionAttributeValues = {};
        super.reset();
    }
    build() {
        this.uniqueIndex = 1;
        this.expressions = {SET: [], REMOVE: []};
        this.expressionAttributeNames = {};
        this.expressionAttributeValues = {};
        super.build();
        var updateExpression = "";
        if (this.expressions.SET.length) {
            updateExpression += " SET " + this.expressions.SET.join(",");
        }
        if (this.expressions.REMOVE.length) {
            updateExpression += " REMOVE " + this.expressions.REMOVE.join(",");
        }
        return {
            UpdateExpression: updateExpression,
            ExpressionAttributeValues: this.expressionAttributeValues
        };
    }
    getUniqueId() {
        return "TOKEN" + this.uniqueIndex++;
    }
    recordValue(command) {
        var identifier = ":" + this.getUniqueId();
        this.expressionAttributeValues[identifier] = command.value;
        return identifier;
    }
    recordField(command) {
        var identifier = "#" + this.getUniqueId();
        this.expressionAttributeNames[identifier] = command.field;
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
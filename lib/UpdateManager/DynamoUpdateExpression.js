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
        this.expressions = [];
        this.expressionAttributeNames = {};
        this.expressionAttributeValues = {};
        super.reset();
    }
    build() {
        this.uniqueIndex = 1;
        this.expressions = [];
        this.expressionAttributeNames = {};
        this.expressionAttributeValues = {};
        super.build();
        return {
            UpdateExpression: this.expressions.join(","),
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
        this.expressions.push(`SET ${command.field} = ${valueIdentifier}`);
    }
    performAdd(command) {
        var valueIdentifier = this.recordValue(command);
        this.expressions.push(`SET ${command.field} = ${command.field} + ${valueIdentifier}`);
    }
    performAppend(command) {
        var valueIdentifier = this.recordValue(command);
        this.expressions.push(`SET ${command.field} = list_append(${command.field} , ${valueIdentifier})`);
    }
    performRemove(command) {
        this.expressions.push(`REMOVE ${command.field}`);
    }
}

module.exports = DynamoUpdateExpression;
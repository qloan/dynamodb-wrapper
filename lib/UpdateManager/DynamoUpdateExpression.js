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
        super.build();
        return {
            UpdateExpression: this.expressions.join(","),
            ExpressionAttributeNames: this.expressionAttributeNames,
            ExpressionAttributeValues: this.expressionAttributeValues
        };
    }
    getUniqueId() {
        return "_" + this.uniqueIndex++;
    }
    recordValue(command) {
        var identifier = ":" + this.getUniqueId();
        this.expressionAttributeNames[identifier] = command.value;
        return identifier;
    }
    recordField(command) {
        var identifier = "#" + this.getUniqueId();
        this.expressionAttributeValues[identifier] = command.field;
        return identifier;
    }
    performSet(command) {
        var valueIdentifier = this.recordValue(command);
        var fieldIdentifier = this.recordField(command);
        this.expressions.push(`SET ${fieldIdentifier}=${valueIdentifier}`);
    }
    performAdd(command) {
        var valueIdentifier = this.recordValue(command);
        var fieldIdentifier = this.recordField(command);
        this.expressions.push(`SET ${fieldIdentifier}=${fieldIdentifier}+${valueIdentifier}`);
    }
    performAppend(command) {
        var valueIdentifier = this.recordValue(command);
        var fieldIdentifier = this.recordField(command);
        this.expressions.push(`SET ${fieldIdentifier}=list_append(${fieldIdentifier},${valueIdentifier})`);
    }
    performRemove(command) {
        var fieldIdentifier = this.recordField(command);
        this.expressions.push(`REMOVE ${fieldIdentifier}`);
    }
}

module.exports = DynamoUpdateExpression;
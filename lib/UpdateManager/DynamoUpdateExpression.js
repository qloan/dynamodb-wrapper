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
        super.reset();
    }
    cleanForBuild() {
        this.expressions = {SET: [], REMOVE: []};
        this.expressionAttributeNames = {};
        this.expressionAttributeValues = {};
        this.updateExpression = "";
    }
    build() {
        super.build();
        return {
            UpdateExpression: this.createUpdateExpression(),
            ExpressionAttributeValues: this.expressionAttributeValues
        };
    }
    createUpdateExpression() {
        return [
            this.createExpression("SET"),
            this.createExpression("REMOVE")
        ].join(" ");
    }
    createExpression(expressionType) {
        return this.expressions[expressionType].length ?
            `${expressionType} ${this.expressions[expressionType].join(",")}` : "";
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
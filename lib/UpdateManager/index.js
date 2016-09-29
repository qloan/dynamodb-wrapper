const DynamoUpdateExpression = require("./DynamoUpdateExpression");
const JsonUpdateExpression = require("./JsonUpdateExpression");
var rocketLoansSdk = require("rocketloans-sdk");
var util = rocketLoansSdk.util;
class UpdateManager {
    constructor(json) {
        this.json = util.clone(json);
        this.jsonUpdateExpression = new JsonUpdateExpression();
        this.jsonUpdateExpression.updateJson(json);
        this.dynamoUpdateExpression = new DynamoUpdateExpression();
    }
    updateJson(json) {
        this.json = util.clone(json);
        this.jsonUpdateExpression.updateJson(json);
        this.dynamoUpdateExpression.reset();
    }
    getDynamoUpdateExpression() {
        return this.dynamoUpdateExpression.build();
    }
    getJson() {
        return this.jsonUpdateExpression.build();
    }
    set(field, value) {
        this.jsonUpdateExpression.constructCommand("SET", field, value);
        this.dynamoUpdateExpression.constructCommand("SET", field, value);
    }
    add(field, value) {
        assertNumeric(value, {error: "Value being added is not a number", location: "UpdateManager::performAdd", field: field, value: value});
        var valueBeingAddedTo = util.getObjKey(this.getJson(), field);
        assertNumeric(valueBeingAddedTo, {error: "Value being added to is not a number", location: "UpdateManager::performAdd", field: field, valueBeingAddedTo: valueBeingAddedTo});
        this.jsonUpdateExpression.constructCommand("ADD", field, value);
        this.dynamoUpdateExpression.constructCommand("ADD", field, value);
    }
    append(field, value) {
        this.jsonUpdateExpression.constructCommand("APPEND", field, value);
        this.dynamoUpdateExpression.constructCommand("APPEND", field, value);
    }
    remove(field) {
        this.jsonUpdateExpression.constructCommand("REMOVE", field);
        this.dynamoUpdateExpression.constructCommand("REMOVE", field);
    }
}

function assertNumeric(value, errorObj) {
    if (!util.isNumeric(value)) {
        console.dir(new Error(JSON.stringify(errorObj)));
    }
}

module.exports = UpdateManager;
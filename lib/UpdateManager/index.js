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

module.exports = UpdateManager;
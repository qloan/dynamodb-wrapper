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
        var numberBeingAddedTo = util.getObjKey(this.getJson(), field);
        var pass = assertNumeric(value, {error: "Value being added is not a number", location: "UpdateManager::add", field: field, value: value});
        pass = pass && assertNumeric(numberBeingAddedTo, {error: "Value being added to is not a number", location: "UpdateManager::add", field: field, numberBeingAddedTo: numberBeingAddedTo});
        if (pass) {
            this.jsonUpdateExpression.constructCommand("ADD", field, value);
            this.dynamoUpdateExpression.constructCommand("ADD", field, value);
        }
    }
    append(field, value) {
        var listBeingAppendedTo = util.getObjKey(this.getJson(), field);
        var pass = assertList(listBeingAppendedTo, {error: "Value being appended to is not a list", location: "UpdateManager::append", field: field, value: value});
        if (pass) {
            this.jsonUpdateExpression.constructCommand("APPEND", field, value);
            this.dynamoUpdateExpression.constructCommand("APPEND", field, value);
        }
    }
    remove(field) {
        this.jsonUpdateExpression.constructCommand("REMOVE", field);
        this.dynamoUpdateExpression.constructCommand("REMOVE", field);
    }
}

function assertNumeric(value, errorObj) {
    if (!util.isNumeric(value)) {
        console.dir(new Error(JSON.stringify(errorObj)));
        return false;
    }
    return true;
}

function assertList(value, errorObj) {
    if (!Array.isArray(value)) {
        console.dir(new Error(JSON.stringify(errorObj)));
        return false;
    }
    return true;
}

module.exports = UpdateManager;
const DynamoUpdateExpression = require("./DynamoUpdateExpression");
const JsonUpdateExpression = require("./JsonUpdateExpression");
var rocketLoansSdk = require("rocketloans-sdk");
var util = rocketLoansSdk.util;
class UpdateManager {
    constructor(json) {
        this.json = util.clone(json);
        this.jsonUpdateExpression = new JsonUpdateExpression(json);
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
    get(field, defaultValue) {
        return util.getObjKey(this.getJson(), field, defaultValue);
    }
    set(field, value) {
        this.jsonUpdateExpression.constructCommand("SET", field, value);
        this.dynamoUpdateExpression.constructCommand("SET", field, value);
    }
    add(field, value) {
        if (this.canAdd(field, value)) {
            this.jsonUpdateExpression.constructCommand("ADD", field, value);
            this.dynamoUpdateExpression.constructCommand("ADD", field, value);
        }
    }
    append(field, value) {
        if (this.canAppend(field, value)) {
            this.jsonUpdateExpression.constructCommand("APPEND", field, value);
            this.dynamoUpdateExpression.constructCommand("APPEND", field, value);
        }
    }
    remove(field) {
        this.jsonUpdateExpression.constructCommand("REMOVE", field);
        this.dynamoUpdateExpression.constructCommand("REMOVE", field);
    }
    canAdd(field, value) {
        var numberBeingAddedTo = this.get(field, 0);
        if (!util.isNumeric(numberBeingAddedTo)) {
            logError({error: "Value being added is not a number", location: "UpdateManager::add", field: field, value: value});
            return false;
        }
        if (!util.isNumeric(value)) {
            logError({error: "Value being added to is not a number", location: "UpdateManager::add", field: field, numberBeingAddedTo: numberBeingAddedTo});
            return false;
        }
        return true;
    }
    canAppend(field, value) {
        var listBeingAppendedTo = this.get(field, []);
        if (!Array.isArray(listBeingAppendedTo)) {
            logError({error: "Value being appended to is not a list", location: "UpdateManager::append", field: field, value: value});
            return false;
        }
        return true;
    }
}

function logError(obj) {
    console.dir(new Error(JSON.stringify(obj)));
}

module.exports = UpdateManager;
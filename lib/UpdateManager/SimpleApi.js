const DynamoUpdateExpression = require("./DynamoUpdateExpression");
const JsonUpdateExpression = require("./JsonUpdateExpression");
var rocketLoansSdk = require("rocketloans-sdk");
var util = rocketLoansSdk.util;
var dependencies = {
    logError: function(obj) {console.dir(new Error(JSON.stringify(obj)));}
};
class UpdateManager {
    constructor(json) {
        this.jsonUpdateExpression = new JsonUpdateExpression(json);
        this.dynamoUpdateExpression = new DynamoUpdateExpression();
        this.dependencies = dependencies;
    }
    updateJson(json) {
        this.jsonUpdateExpression.updateJson(json);
        this.dynamoUpdateExpression.reset();
    }
    getDynamoUpdateExpression() {
        return this.dynamoUpdateExpression.build();
    }
    get(field, defaultValue) {
        field = field || [];
        return util.getObjKey(this.jsonUpdateExpression.build(), field, defaultValue);
    }
    set(field, value) {
        this.jsonUpdateExpression.constructCommand("SET", field, value);
        this.dynamoUpdateExpression.constructCommand("SET", field, value);
    }
    add(field, value) {
        if (this.assertCanAdd(field, value)) {
            this.jsonUpdateExpression.constructCommand("ADD", field, value);
            this.dynamoUpdateExpression.constructCommand("ADD", field, value);
        }
    }
    append(field, value) {
        if (this.assertCanAppend(field, value)) {
            this.jsonUpdateExpression.constructCommand("APPEND", field, value);
            this.dynamoUpdateExpression.constructCommand("APPEND", field, value);
        }
    }
    remove(field) {
        this.jsonUpdateExpression.constructCommand("REMOVE", field);
        this.dynamoUpdateExpression.constructCommand("REMOVE", field);
    }
    assertCanAdd(field, value) {
        var numberBeingAddedTo = this.get(field, 0);
        if (!util.isNumeric(numberBeingAddedTo)) {
            this.dependencies.logError({error: "Value being added is not a number", location: "UpdateManager::add", field: field, value: value});
            return false;
        }
        if (!util.isNumeric(value)) {
            this.dependencies.logError({error: "Value being added to is not a number", location: "UpdateManager::add", field: field, numberBeingAddedTo: numberBeingAddedTo});
            return false;
        }
        return true;
    }
    assertCanAppend(field, value) {
        var listBeingAppendedTo = this.get(field, []);
        if (!Array.isArray(listBeingAppendedTo)) {
            this.dependencies.logError({error: "Value being appended to is not a list", location: "UpdateManager::append", field: field, value: value});
            return false;
        }
        return true;
    }
}

module.exports = UpdateManager;
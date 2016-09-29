var rocketLoansSdk = require("rocketloans-sdk");
var UpdateExpression = require("./UpdateExpression");
var util = rocketLoansSdk.util;
var __FIELD_NOT_FOUND = "__FIELD_NOT_FOUND";

class JsonUpdateExpression extends UpdateExpression {
    constructor() {
        super();
    }
    reset() {
        super.reset();
        this.json = util.clone(this.originalJson);
    }
    updateJson(json) {
        this.originalJson = util.clone(json);
        this.reset();
    }
    build() {
        super.build();
        return this.json;
    }
    performSet(command) {
        util.setObjKey(this.json, command.field, command.value);
    }
    performAdd(command) {
        var before = util.getObjKey(this.json, command.field, 0);
        var numberToAdd = parseFloat(command.value);
        if (!util.isNumeric(numberToAdd)) {
            this.errors.push({
                location: "JsonUpdateExpression::performAdd",
                value: numberToAdd,
                error: "Value is not a number"
            });
        } else {
            util.setObjKey(this.json, command.field, before + numberToAdd);
        }
    }
    performAppend(command) {
        var arrayAtLocation = util.getObjKey(this.json, command.field, []);
        arrayAtLocation.push(command.value);
    }
    performRemove(command) {
        var field = util.isArray(command.field) ? command.field : command.field.split(".");
        var back = field[field.length - 1];
        field.pop();
        var obj = util.getObjKey(this.json, field, __FIELD_NOT_FOUND);
        if (obj !== __FIELD_NOT_FOUND) {
            delete obj[back];
        }
    }
}

module.exports = JsonUpdateExpression;
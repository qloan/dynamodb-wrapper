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
        util.setObjKey(this.json, command.field, before + numberToAdd);
    }
    performAppend(command) {
        var valueToAppend = util.forceArray(command.value);
        var parentReference = util.getReferenceToParent(this.json, command.field, __FIELD_NOT_FOUND);
        var back = util.getLastField(command.field);
        parentReference[back] = parentReference[back].concat(valueToAppend);
    }
    performRemove(command) {
        var parentReference = util.getReferenceToParent(this.json, command.field, __FIELD_NOT_FOUND);
        var back = util.getLastField(command.field);
        if (parentReference !== __FIELD_NOT_FOUND) {
            delete parentReference[back];
        }
    }
}

module.exports = JsonUpdateExpression;
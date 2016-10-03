var rocketLoansSdk = require("rocketloans-sdk");
var UpdateExpression = require("./UpdateExpression");
var util = rocketLoansSdk.util;
var __FIELD_NOT_FOUND = "__FIELD_NOT_FOUND";

class JsonUpdateExpression extends UpdateExpression {
    constructor(json) {
        super();
        this.originalJson = util.clone(json);
    }
    reset() {
        super.reset();
    }
    updateJson(json) {
        this.originalJson = util.clone(json);
        this.reset();
    }
    cloneOriginalJson() {
        this.json = util.clone(this.originalJson);
    }
    build() {
        this.cloneOriginalJson();
        super.build();
        return this.json;
    }
    performSet(command) {
        util.setObjKey(this.json, command.field, command.value);
    }
    performAdd(command) {
        var before = util.getObjKey(this.json, command.field, 0);
        var numberToAdd = parseFloat(command.value);
        util.setObjKey(this.json, command.field, Number(before) + Number(numberToAdd));
    }
    performAppend(command) {
        if (util.getObjKey(this.json, command.field, __FIELD_NOT_FOUND) === __FIELD_NOT_FOUND) {
            util.setObjKey(this.json, command.field, []);
        }
        var valueToAppend = util.forceArray(command.value);
        var back = util.getLastField(command.field);
        var parentReference = util.getReferenceToParent(this.json, command.field, __FIELD_NOT_FOUND);
        parentReference[back] = parentReference[back].concat(valueToAppend);
    }
    performRemove(command) {
        var parentReference = util.getReferenceToParent(this.json, command.field, __FIELD_NOT_FOUND);
        if (parentReference !== __FIELD_NOT_FOUND) {
            var back = util.getLastField(command.field);
            delete parentReference[back];
        }
    }
}

module.exports = JsonUpdateExpression;
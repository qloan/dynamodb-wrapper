var rocketLoansSdk = require("rocketloans-sdk");
var BaseUpdateExpression = require("./baseUpdateExpression");
var util = rocketLoansSdk.util;
var __FIELD_NOT_FOUND = "__FIELD_NOT_FOUND";

class JsonUpdateExpression extends BaseUpdateExpression {
    constructor(json) {
        super();
        this.originalJson = util.clone(json);
    }
    build() {
        this.json = util.clone(this.originalJson);
        super.build();
        return util.clone(this.json);
    }
    performSet(command) {
        util.setObjKey(this.json, command.field, command.value);
    }
    performAdd(command) {
        var before = util.getObjKey(this.json, command.field, 0);
        util.setObjKey(this.json, command.field, Number(before) + Number(command.value));
    }
    performAppend(command) {
        var oldValue = util.getObjKey(this.json, command.field, []);
        var valueToAppend = util.forceArray(command.value);
        util.setObjKey(this.json, command.field, oldValue.concat(valueToAppend));
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
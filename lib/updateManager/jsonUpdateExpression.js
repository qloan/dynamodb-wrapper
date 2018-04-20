var rocketLoansSdk = require("rocketloans-sdk");
var BaseUpdateExpression = require("./baseUpdateExpression");
var util = rocketLoansSdk.util;

var __FIELD_NOT_FOUND = "__FIELD_NOT_FOUND";

class JsonUpdateExpression extends BaseUpdateExpression {
    constructor(json) {
        super();
        this.json = json;
    }
    performGet(field, defaultValue) {
        return util.clone(util.getObjKey(this.json, util.clone(field), defaultValue));
    }
    performSet(field, value) {
        util.setObjKey(this.json, util.clone(field), util.clone(value));
    }
    performAdd(field, value) {
        var before = util.getObjKey(this.json, util.clone(field), 0);
        util.setObjKey(this.json, util.clone(field), Number(before) + Number(value));
    }
    performAppend(field, value) {
        var oldValue = util.getObjKey(this.json, util.clone(field), []);
        var valueToAppend = util.forceArray(util.clone(value));
        util.setObjKey(this.json, util.clone(field), oldValue.concat(valueToAppend));
    }
    performRemove(field) {
        var parentReference = util.getReferenceToParent(this.json, field, __FIELD_NOT_FOUND);
        if (parentReference !== __FIELD_NOT_FOUND) {
            var back = util.getLastField(field);
            delete parentReference[back];
        }
    }
}

module.exports = JsonUpdateExpression;
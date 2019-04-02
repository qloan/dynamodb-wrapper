var rocketLoansSdk = require("rocketloans-sdk");
var BaseUpdateExpression = require("./baseUpdateExpression");
var util = rocketLoansSdk.util;
var _ = require("lodash");

var __FIELD_NOT_FOUND = "__FIELD_NOT_FOUND";

class JsonUpdateExpression extends BaseUpdateExpression {
    constructor(json) {
        super();
        this.json = _.cloneDeep(json);
    }
    performGet(field, defaultValue) {
        field = field || [];
        let output = util.getObjKey(this.json, _.cloneDeep(field), defaultValue);
        return _.cloneDeep(output);
    }
    performSet(field, value) {
        _.set(this.json, _.cloneDeep(field), _.cloneDeep(value));
    }
    performAdd(field, value) {
        var before = util.getObjKey(this.json, _.cloneDeep(field), 0);
        _.set(this.json, _.cloneDeep(field), Number(before) + Number(value));
    }
    performAppend(field, value) {
        var oldValue = util.getObjKey(this.json, _.cloneDeep(field), []);
        var valueToAppend = util.forceArray(_.cloneDeep(value));
        _.set(this.json, _.cloneDeep(field), oldValue.concat(valueToAppend));
    }
    performRemove(field) {
        var parentReference = util.getReferenceToParent(this.json, _.cloneDeep(field), __FIELD_NOT_FOUND);
        if (parentReference !== __FIELD_NOT_FOUND) {
            var back = util.getLastField(_.cloneDeep(field));
            delete parentReference[back];
        }
    }
}

module.exports = JsonUpdateExpression;
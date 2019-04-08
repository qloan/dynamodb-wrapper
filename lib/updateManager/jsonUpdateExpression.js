var BaseUpdateExpression = require("./baseUpdateExpression");
var _ = require("lodash");
var __FIELD_NOT_FOUND = "__FIELD_NOT_FOUND";
const util = require('../util/util')

class JsonUpdateExpression extends BaseUpdateExpression {
    constructor(json) {
        super();
        this.json = util.clone(json);
    }
    performGet(field, defaultValue) {
        field = field || [];
        let output = field.length ? _.get(this.json, util.clone(field), defaultValue) : this.json;
        return util.clone(output);
    }
    performSet(field, value) {
        _.set(this.json, util.clone(field), util.clone(value));
    }
    performAdd(field, value) {
        field = field || [];
        var before = field.length ? _.get(this.json, field, 0) : this.json;
        _.set(this.json, util.clone(field), Number(before) + Number(value));
    }
    performAppend(field, value) {
        field = field || [];
        const oldValue = field.length ? _.get(this.json, util.clone(field), []) : this.json;
        const clonedValue = util.clone(value);
        var valueToAppend = Array.isArray(clonedValue) ? clonedValue : [clonedValue];
        _.set(this.json, util.clone(field), oldValue.concat(valueToAppend));
    }
    getReferenceToParent(field, defaultVal) {
        field = Array.isArray(field) ? field : field.split('.');
        field.pop();
        return field.length ? _.get(this.json, field, defaultVal) : this.json;
    }
    getLastField(field) {
        field = Array.isArray(field) ? field : field.split('.');
        return field[field.length - 1];
    }
    performRemove(field) {
        var parentReference = this.getReferenceToParent(util.clone(field), __FIELD_NOT_FOUND);
        if (parentReference !== __FIELD_NOT_FOUND) {
            var back = this.getLastField(util.clone(field));
            delete parentReference[back];
        }
    }
}

module.exports = JsonUpdateExpression;
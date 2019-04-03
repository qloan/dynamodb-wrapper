var BaseUpdateExpression = require("./baseUpdateExpression");
var _ = require("lodash");
var __FIELD_NOT_FOUND = "__FIELD_NOT_FOUND";

class JsonUpdateExpression extends BaseUpdateExpression {
    constructor(json) {
        super();
        this.json = _.cloneDeep(json);
    }
    performGet(field, defaultValue) {
        field = field || [];
        let output = field.length ? _.get(this.json, _.cloneDeep(field), defaultValue) : this.json;
        return _.cloneDeep(output);
    }
    performSet(field, value) {
        _.set(this.json, _.cloneDeep(field), _.cloneDeep(value));
    }
    performAdd(field, value) {
        field = field || [];
        var before = field.length ? _.get(this.json, field, 0) : this.json;
        _.set(this.json, _.cloneDeep(field), Number(before) + Number(value));
    }
    performAppend(field, value) {
        field = field || [];
        var oldValue = field.length ? _.get(this.json, _.cloneDeep(field), []) : this.json;
        const clonedValue = _.cloneDeep(value);
        var valueToAppend = Array.isArray(clonedValue) ? clonedValue : [clonedValue];
        _.set(this.json, _.cloneDeep(field), oldValue.concat(valueToAppend));
    }
    getReferenceToParent(field, defaultVal) {
        field = Array.isArray(field) ? field : field.split(".");
        field.pop();
        return field.length ? _.get(this.json, field, defaultVal) : this.json;
    }
    getLastField(field) {
        field = Array.isArray(field) ? field : field.split(".");
        return field[field.length - 1];
    }
    performRemove(field) {
        var parentReference = this.getReferenceToParent(_.cloneDeep(field), __FIELD_NOT_FOUND);
        if (parentReference !== __FIELD_NOT_FOUND) {
            var back = this.getLastField(_.cloneDeep(field));
            delete parentReference[back];
        }
    }
}

module.exports = JsonUpdateExpression;
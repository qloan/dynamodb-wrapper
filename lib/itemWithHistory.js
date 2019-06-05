const _ = require('lodash');
const PromisifiedItem = require('./promisifiedItem');

class ItemWithHistory extends PromisifiedItem {
    constructor(json = {}) {
        super(Object.assign({}, { history: [] }, json));

        this.changes = {};
    }

    shouldAddHistory() {
        return false;
    }

    /**
     * @param {string} field
     * @return {boolean}
     */
    shouldAddHistoryForField(field) {
        const [historyBaseField] = (field || '').split('.');

        return this.shouldAddHistory(historyBaseField);
    }

    set(field, newValue) {
        this.setHistory(field, newValue);

        return super.set(field, newValue);
    }

    remove(field) {
        this.setHistory(field, null);

        return super.remove(field);
    }

    create() {
        this._updateHistory();
        return super.create();
    }

    async update() {
        this.changeTimestamp = null;
        this._updateHistory();
        await super.update();
        this.changes = {};
    }

    setHistory(field, value) {
        const parts = (field || '').split('.');
        const historyBaseField = parts[0];
        const historyField = parts[1] || historyBaseField;

        if (!this.shouldAddHistoryForField(field)) return;

        const oldValue = this.get(field);

        if (_.isEqual(oldValue, value)) return;

        this.changeTimestamp = this.changeTimestamp || new Date().toISOString();

        const historyObject = {
            field: historyField,
            newValue: value,
            timestamp: this.changeTimestamp
        };

        if (oldValue) historyObject.oldValue = oldValue;

        this.changes[historyBaseField] = this.changes[historyBaseField] || [];
        this.changes[historyBaseField].push(historyObject);
    }

    _updateHistory() {
        const changeKeys = Object.keys(this.changes);
        if (changeKeys.length) {
            changeKeys.forEach((key) => {
                this.append(`${key}History`, this.changes[key]);
            });
        }
    }

    getFirstHistoricalEntry(fieldName, value) {
        const olderStatusHistory = this.get(`${fieldName}History`, []);
        const fresherStatusHistory = _.get(this, `changes.${fieldName}`, []);
        const firstEntry = _.chain(olderStatusHistory)
            .concat(fresherStatusHistory)
            .orderBy('timestamp', ['asc'])
            .find({
                newValue: value
            })
            .value();
        return firstEntry;
    }
}

module.exports = ItemWithHistory;

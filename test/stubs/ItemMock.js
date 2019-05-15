const Item = require('../../lib/item');

class ItemMock extends Item {
    constructor(obj = { schema: {} }) {
        const props = Object.assign({}, obj);
        if (!props.schema) {
            props.schema = {};
        }
        super(props);
        this.fields = {};
        this._createdItems = [];
    }

    create() { // eslint-disable-line
        this._createdItems.push(Object.assign({}, this.get()));
        return true;
    }

    update() { // eslint-disable-line
        return true;
    }

    reset() {
        this._createdItems = [];
    }
}

module.exports = ItemMock;

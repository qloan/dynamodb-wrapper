const ImmutableItem = require('./immutableItem');
const { promisify } = require('util');
const _ = require('lodash');

class ItemWithStream extends ImmutableItem {
    constructor(props) {
        super({
            attrs: props.attrs,
            schema: props.schema
        });
        this.itemKey = props.attrs.itemKey;
        this.hashKey = props.attrs[props.schema.key.hash];
        this.hashName = props.schema.key.hash;
    }

    async updateVersion() {
        const current = await promisify(this.schema.query.bind(this.schema))({
            KeyConditionExpression: `${this.hashName} = :TOKEN1 AND itemKey = :TOKEN2`,
            ExpressionAttributeValues: {
                ':TOKEN1': this.hashKey,
                ':TOKEN2': `${this.itemKey}_latest`
            }
        });

        let versionNumber = 0;
        if (current.Count) {
            versionNumber = _.get(current.Items[0], 'versionNumber', 0);
        }

        this.set('versionNumber', versionNumber + 1);
    }

    version() {
        return this.get('versionNumber');
    }

    async create() {
        await this.updateVersion();

        this.set('itemKey', `${this.itemKey}_latest`);
        await super.create();

        this.set('itemKey', `${this.itemKey}_v${this.version()}`);
        await super.create();
    }
}

module.exports = ItemWithStream;


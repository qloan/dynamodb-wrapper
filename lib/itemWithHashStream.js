const ImmutableItem = require('./immutableItem');
const { promisify } = require('util');
const _ = require('lodash');

class ItemWithHashStream extends ImmutableItem {
    constructor(props) {
        super({
            attrs: props.attrs,
            schema: props.schema
        });
        this.hashKey = props.attrs[props.schema.key.hash];
        this.hashName = props.schema.key.hash;
    }

    async updateVersion() {
        const current = await promisify(this.schema.query.bind(this.schema))({
            KeyConditionExpression: `${this.hashName} = :TOKEN1`,
            ExpressionAttributeValues: {
                ':TOKEN1': `${this.hashKey}_latest`
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

        this.set(`${this.hashName}`, `${this.hashKey}_latest`);
        await super.create();

        this.set(`${this.hashName}`, `${this.hashKey}_v${this.version()}`);
        await super.create();
    }
}

module.exports = ItemWithHashStream;


const chai = require('chai');
const proxyquire = require('proxyquire');
const ItemMock = require('../stubs/ItemMock');

const { expect } = chai;

const ItemWithStream = proxyquire('../../lib/itemWithStream', {
    './immutableItem': ItemMock
});

function schemaQuery(count, items) {
    return function query(a, cb) {
        cb(null, {
            Count: count,
            Items: items
        });
    };
}
describe('itemWithStream', () => {
    let myItem;

    beforeEach(() => {
        myItem = new ItemWithStream({
            attrs: { itemKey: 'somekey' },
            schema: {
                key: {
                    hash: 'itemKey'
                },
                query: schemaQuery(0, [])
            }
        });
    });

    it('should add history to a NEW item', async () => {
        myItem.set('test', 'aaa');
        await myItem.create();
        expect(myItem._createdItems.length).to.equal(2);
        expect(myItem._createdItems[0].itemKey).to.equal('somekey_latest');
        expect(myItem._createdItems[1].itemKey).to.equal('somekey_v1');
        expect(myItem._createdItems[0].versionNumber).to.equal(1);
        expect(myItem._createdItems[1].versionNumber).to.equal(1);
    });

    it('should add history to an existing item', async () => {
        myItem.set('test', 'aaa');
        myItem.schema.query = schemaQuery(1, [{ versionNumber: 1 }]);
        await myItem.create();
        expect(myItem.version()).to.equal(2);
        expect(myItem._createdItems.length).to.equal(2);
        expect(myItem._createdItems[0].itemKey).to.equal('somekey_latest');
        expect(myItem._createdItems[1].itemKey).to.equal('somekey_v2');
        expect(myItem._createdItems[0].versionNumber).to.equal(2);
        expect(myItem._createdItems[1].versionNumber).to.equal(2);
    });
});

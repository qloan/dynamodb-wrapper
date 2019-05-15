const chai = require('chai');
const { describe } = require('mocha');
const proxyquire = require('proxyquire');

const ItemMock = require('../stubs/ItemMock');

const { expect } = chai;

const ItemWithHistory = proxyquire(
    '../../lib/itemWithHistory', {
        './promisifiedItem': ItemMock
    }
);
// proxyquire.callThru();

describe('itemWithHistory', () => {
    let myItem;

    before(() => {});

    beforeEach(() => {
        myItem = new ItemWithHistory();
        myItem.shouldAddHistory = () => true;
    });

    after(() => {});

    afterEach(() => {});

    describe('#getFirstHistoricalEntry()', function () {
        it('Set status and get timestamp, pre update', function () {
            const expectedTimestamp = new Date('2018-01-01').toISOString();
            myItem.changeTimestamp = expectedTimestamp;
            myItem.set('statusCode', 300);
            expect(myItem.getFirstHistoricalEntry('statusCode', 300).timestamp)
                .to
                .equal(expectedTimestamp);
        });

        it('Set status, update, get status', async function () {
            const expectedTimestamp = new Date('2018-01-01').toISOString();
            myItem.changeTimestamp = expectedTimestamp;
            myItem.set('statusCode', 300);
            await myItem.update();
            expect(myItem.getFirstHistoricalEntry('statusCode', 300).timestamp)
                .to
                .equal(expectedTimestamp);
        });

        it('Pick an entry from either location - should pick oldest', async function () {
            const newerTimestamp = new Date('2018-01-02').toISOString();
            myItem.changeTimestamp = newerTimestamp;
            myItem.set('statusCode', 300);
            await myItem.update();
            const olderTimestamp = new Date('2018-01-01').toISOString();
            myItem.set('statusCode', 301);
            myItem.changeTimestamp = olderTimestamp;
            myItem.set('statusCode', 300);
            expect(myItem.getFirstHistoricalEntry('statusCode', 300).timestamp)
                .to
                .equal(olderTimestamp);
        });
    });

    describe('#remove()', function () {
        it('should add history for a removed item', async function () {
            const field = 'foo';
            const initialValue = 'bar';

            myItem.set(field, initialValue);
            myItem.remove(field);
            await myItem.update();

            const history = myItem.get(`${field}History`);

            expect(history.length).to.equal(2);
            expect(history[1].field).to.equal(field);
            expect(history[1].newValue).to.equal(null);
        });

        it(
            'should not add history for a removed item which shouldn\'t add history',
            async function () {
                const field = 'foo';
                const initialValue = 'bar';

                myItem.shouldAddHistory = () => false;

                myItem.set(field, initialValue);
                myItem.remove(field);
                await myItem.update();

                const history = myItem.get(`${field}History`);

                expect(history).to.be.undefined;
            }
        );
    });

    describe('#set()', function () {
        it('should add history to an item', async () => {
            myItem.set('test', 'aaa');
            expect(myItem.get('test')).to.equal('aaa');
            await myItem.update();
            const history = myItem.get('testHistory');
            expect(history.length).to.equal(1);
            expect(history[0].field).to.equal('test');
            expect(history[0].newValue).to.equal('aaa');
        });

        it('should keep the same timestamp for multiple history changes', async () => {
            myItem.set('test', 'aaa');
            myItem.set('test2', 'test2');
            await myItem.update();
            const testHistory = myItem.get('testHistory');
            expect(testHistory.length).to.equal(1);
            expect(testHistory[0].field).to.equal('test');
            expect(testHistory[0].newValue).to.equal('aaa');

            const test2History = myItem.get('test2History');
            expect(test2History.length).to.equal(1);
            expect(test2History[0].field).to.equal('test2');
            expect(test2History[0].newValue).to.equal('test2');
            expect(testHistory[0].timestamp).to.equal(test2History[0].timestamp);
            expect(testHistory[0].timestamp).to.match(/^\d{4}-\d{2}-\d{2}/);
        });

        it('should keep the old key and the new key if something has been set multiple times', async () => {
            myItem.set('test', 'aaa');
            await myItem.update();
            myItem.set('test', 'bbb');
            await myItem.update();
            const testHistory = myItem.get('testHistory');
            expect(testHistory.length).to.equal(2);
            expect(testHistory[0].field).to.equal('test');
            expect(testHistory[0].newValue).to.equal('aaa');
            expect(testHistory[1].field).to.equal('test');
            expect(testHistory[1].oldValue).to.equal('aaa');
            expect(testHistory[1].newValue).to.equal('bbb');
        });

        it('should not add history if field hasn\'t changed', async () => {
            myItem = new ItemWithHistory({ test: { property: 'some value' } });
            myItem.set('test', { property: 'some value' });

            await myItem.update();

            expect(myItem.get('testHistory')).to.not.exist;
        });
    });
});

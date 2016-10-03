const Observable = require('./observable');
const async      = require('async');
const chai       = require('chai');
const spies      = require('chai-spies');
const expect     = chai.expect;
const assert     = chai.assert;

chai.use(spies);

describe('Observable', () => {

    let observable;

    beforeEach((done) => {
        observable = new Observable();
        done();
    });

    afterEach((done) => {
        observable = null;
        done();
    });

    it('should throw an error when emit method is called without a callback as the last argument.', (done) => {
        let spy = chai.spy(() => {});
        observable.on('someEvent', spy);

        try {
            observable.emit('someEvent')
        }catch(e) {
            expect(e instanceof Error).to.be.true;
        }

        done();
    });

    it('should call all registered handlers', (done) => {
        let eventHandler = (data, cb) => {
            cb();
        };

        let spy = chai.spy(eventHandler);

        observable.on('someEvent', spy);
        observable.on('someEvent', spy);
        observable.on('someEvent', spy);

        async.series([
            (next) => {
                observable.emit('someEvent', 'some data', next);
            },
            (next) => {
                observable.emit('someEvent', 'some data', (err) => {
                    expect(spy).to.have.been.called.exactly(6);
                    expect(spy).to.have.been.called.with('some data');
                    done();
                });
            }
        ], done);
    });

    it('should stop firing handlers and call emit callback with error if any handler returns an error', (done) => {
        let eventHandler1 = (data, cb) => {
            cb();
        };
        let eventHandler2 = (data, cb) => {
            cb('Something went wrong');
        };
        let eventHandler3 = (data, cb) => {
            cb();
        };

        let spy1 = chai.spy(eventHandler1);
        let spy2 = chai.spy(eventHandler2);
        let spy3 = chai.spy(eventHandler3);

        observable.on('someEvent', spy1);
        observable.on('someEvent', spy2);
        observable.on('someEvent', spy3);

        observable.emit('someEvent', 'some data', (err) => {
            expect(spy1).to.have.been.called.once();
            expect(spy2).to.have.been.called.once();
            expect(err).to.equal('Something went wrong');
            done();
        })
    });

    it('should properly update a passed object', (done) => {
        let data = {
            event: 'something'
        };
        let eventHandler1 = (data, cb) => {
            data.handler1 = true;
            cb();
        };
        let eventHandler2 = (data, cb) => {
            data.handler2 = true;
            cb();
        };
        let eventHandler3 = (data, cb) => {
            data.handler3 = true;
            cb();
        };

        observable.on('someEvent', eventHandler1);
        observable.on('someEvent', eventHandler2);
        observable.on('someEvent', eventHandler3);

        observable.emit('someEvent', data, (err) => {
            expect(data).to.deep.equal({
                event    : 'something',
                handler1 : true,
                handler2 : true,
                handler3 : true
            });
            done();
        })
    });
});

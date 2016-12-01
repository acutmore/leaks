const mocha = require('mocha');
const assert = require('assert');
const Rx = require('rx');
global.Rx = Rx;
require('../leaks');

describe('Leak$', function() {
    function assertCurrentSubscriptions(expected) {
        assert.equal(global.leaks.subscriptions.getValue(), expected);
    }
    function oneValueNever() {
        return Rx.Observable.create(function(observer) {
            observer.onNext(1);
        });
    }
    beforeEach(function() {
        assertCurrentSubscriptions(0);
    });
    afterEach(function() {
        assertCurrentSubscriptions(0);
    });
    it('has been added to the global scope', function() {
        assert(global.leaks.trace === false);
        assert(global.leaks.stacks != null);
    });
    it('works with interval', function() {
        const disposable = Rx.Observable.interval(100).subscribe();
        assertCurrentSubscriptions(1);
        disposable.dispose();
    });
    it('works with subjects', function() {
        const subject = new Rx.Subject();
        assertCurrentSubscriptions(0);
        const disposable = subject.subscribe();
        assertCurrentSubscriptions(1);
        disposable.dispose();
    });
    it('works with flat mapped streams', function() {
       const disposable = oneValueNever()
        .flatMap(function() {
            return oneValueNever();
        })
        .subscribe();
        assertCurrentSubscriptions(4);
        disposable.dispose();
    });
    it('works with the same observable multiple times', function() {
        const disposable1 = oneValueNever().subscribe();
        assertCurrentSubscriptions(1);
        const disposable2 = oneValueNever().subscribe();
        assertCurrentSubscriptions(2);
        disposable1.dispose();
        assertCurrentSubscriptions(1);
        disposable2.dispose();
    });
});
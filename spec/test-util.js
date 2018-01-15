'use strict';

const {promisify} = require('util');

function Deferred() {
    this.promise = new Promise((res, rej) => {
        this.resolve = res;
        this.reject = rej;
    });
}
Deferred.stub = function(spy) {
    const deferrals = [];
    spy.and.callFake(() => {
        const d = new Deferred();
        deferrals.push(d);
        return d.promise;
    });
    return deferrals;
};

const promiseHandlersCalled = promisify(setImmediate);

module.exports = {
    Deferred,
    promiseHandlersCalled,
};

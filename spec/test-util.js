'use strict';

const {promisify} = require('util');

function Deferred() {
    this.promise = new Promise((res, rej) => {
        this.resolve = res;
        this.reject = rej;
    });
}
Deferred.stub = function(spy) {
    const deferred = new Deferred();
    spy.and.returnValue(deferred.promise);
    return deferred;
};

const promiseHandlersCalled = promisify(setImmediate);

module.exports = {
    Deferred,
    promiseHandlersCalled,
};

'use strict';

const {promisify} = require('util');

function Deferred() {
    this.promise = new Promise((res, rej) => {
        this.resolve = res;
        this.reject = rej;
    });
}

const immediate = promisify(setImmediate);

module.exports = {
    Deferred,
    immediate,
}

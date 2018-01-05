'use strict';

const fs = require('fs');
const util = require('util');

const open = util.promisify(fs.open);
const write = util.promisify(fs.write);
const fdatasync = util.promisify(fs.fdatasync);
const close = util.promisify(fs.close);

class FileOutput {
    constructor(format) {
        this._fd = null;
        this._format = format;
    }

    open(fileName) {
        return open(fileName, 'wx').then(fd => this._fd = fd);
    }

    write(log) {
        return write(this._fd, this._format(log.body));
    }

    commit() {
        return fdatasync(this._fd);
    }

    close() {
        const promise = close(this._fd);
        this._fd = null;
        return promise;
    }
}

module.exports = FileOutput;

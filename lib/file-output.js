'use strict';

const fs = require('fs');
const util = require('util');
const s3LogToCsv = require('./csv-format');

const open = util.promisify(fs.open);
const write = util.promisify(fs.write);
const fdatasync = util.promisify(fs.fdatasync);
const close = util.promisify(fs.close);

class CsvFileOutput {
    constructor() {
        this._fd = null;
    }

    open(fileName) {
        return open(fileName, 'wx').then(fd => this._fd = fd);
    }

    write(log) {
        return write(this._fd, s3LogToCsv(log));
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

module.exports = CsvFileOutput;

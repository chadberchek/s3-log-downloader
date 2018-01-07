'use strict';

const fs = require('fs');
const util = require('util');

const open = util.promisify(fs.open);
const write = util.promisify(fs.write);
const fdatasync = util.promisify(fs.fdatasync);
const close = util.promisify(fs.close);

function fileOutput(format) {
    const _format = format;
    let _fd = null;

    return {
        open: fileName => open(fileName, 'wx').then(fd => _fd = fd),
        write: log => write(_fd, _format(log.body)),
        commit: () => fdatasync(_fd),
        close() {
            const promise = close(_fd);
            _fd = null;
            return promise;
        }
    };
}

module.exports = fileOutput;

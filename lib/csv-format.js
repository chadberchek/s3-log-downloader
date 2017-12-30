'use strict';

const logEntryProperties = [
    'bucketOwner',
    'bucket',
    'time',
    'remoteIp',
    'requester',
    'requestId',
    'operation',
    'key',
    'requestUri',
    'httpStatus',
    'errorCode',
    'bytesSent',
    'objectSize',
    'totalTime',
    'turnAroundTime',
    'referrer',
    'userAgent',
    'versionId',
    'httpMethod',
    'pathname',
    'queryString',
    'httpVersion',
];

function valueToString(x) {
    if (x === null || typeof x === 'undefined') return '';
    if (typeof x === 'number') return x.toString();
    if (x instanceof Date) return x.toISOString();
    return '"' + x.toString().replace(/"/g, '""') + '"';
}

function csv(log) {
    return log.logEntries.reduce((result, entry, index) => {
        return result + valueToString(log.logKey) + ',' + valueToString(index) +
                logEntryProperties.reduce((result, key) => {
                    return result + ',' + valueToString(entry[key]);
                }, '') + '\r\n';
    }, '');
}

module.exports = csv;

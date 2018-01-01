'use strict';

const logEntryProperties = [
    'logFileName',
    'lineNumber',
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

function entryToCsvLine(entry) {
    return logEntryProperties.map(prop => valueToString(entry[prop])).join() + '\r\n';
}

function csv(logEntries) {
    return logEntries.reduce((result, entry) => result + entryToCsvLine(entry), '');
}

module.exports = csv;

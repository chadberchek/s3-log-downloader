'use strict';

const { URL } = require('url');
const moment = require('moment');

class S3LogFormatError extends Error {
    constructor(message) {
        super(message);        
    }    
}
S3LogFormatError.prototype.name = 'S3LogFormatError';

function parseLogLine(line) {
    const regex = /^(\S+) (\S+) \[(.+?)\] (\S+) (\S+) (\S+) (\S+) (\S+) "(.+?)" (\S+) (\S+) (\S+) (\S+) (\S+) (\S+) "(.+?)" "(.+?)" (\S+)/;
    let parts = regex.exec(line);
    if (!parts) throw new S3LogFormatError(`Line does not match expected format: ${line}`);
    parts = parts.map(x => x === '-' ? null : x);
        
    const entry = {
        bucketOwner: parts[1],
        bucket: parts[2],
        time: parseS3LogTime(parts[3]),
        remoteIp: parts[4],
        requester: parts[5],
        requestId: parts[6],
        operation: parts[7],
        key: parts[8],
        requestUri: parts[9],
        httpStatus: numberOrNull(parts[10]),
        errorCode: parts[11],
        bytesSent: numberOrNull(parts[12], 0),
        objectSize: numberOrNull(parts[13]),
        totalTime: numberOrNull(parts[14]),
        turnAroundTime: numberOrNull(parts[15]),
        referrer: parts[16],
        userAgent: parts[17],
        versionId: parts[18],
        httpMethod: null,
        pathname: null,
        queryString: null,
        httpVersion: null,
    };

    if (entry.requestUri) {
        const requestParts = entry.requestUri.split(' ');
        if (requestParts.length != 3) {
            throw new S3LogFormatError(
                `Request-URI does not have 3 space delimited parts: ${entry.requestUri}`);
        }
        entry.httpMethod = requestParts[0];
        entry.httpVersion = requestParts[2];
        const url = new URL(requestParts[1], 'http://dummy');
        entry.queryString = url.search ? url.search.substr(1) : null;
        entry.pathname = url.pathname;
    }
        
    return entry;
}

function numberOrNull(str, defaultIfNull = null) {
    if (str === null) return defaultIfNull;
    const n = Number(str);
    if (isNaN(n)) throw new S3LogFormatError(`Not a number: ${str}`);
    return n;
}

function parseS3LogTime(timeString) {
    if (timeString === null) return null;
    const time = moment(timeString, "D/MMM/YYYY:H:m:s Z", true);
    if (!time.isValid()) throw new S3LogFormatError(`Invalid time string: ${timeString}`);
    return time.toDate();
}

function splitLines(log) {
    return log.split(/\r?\n/).filter(x => x !== '');
}

function parseS3Log(log) {
    return splitLines(log).map(parseLogLine);
}

exports.parseS3Log = parseS3Log;
exports.S3LogFormatError = S3LogFormatError;

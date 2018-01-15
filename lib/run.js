'use strict';

const https = require('https');
const AWS = require('aws-sdk');
const logFetcher = require('./log-fetcher');
const fileOutput = require('./file-output');
const listBucket = require('./list-bucket');
const csvFormat = require('./csv-format');
const {parseS3Log} = require('./parse-s3-log');
const getLog = require('./get-log');
const logConverter = require('./convert-log');

function createS3Client(region, credentials) {
    return new AWS.S3({
        httpOptions: { 
            agent: new https.Agent({keepAlive: true, keepAliveMsecs: 1000})
        },
        apiVersion: '2006-03-01',
        region,
        credentials
    });
}

async function run({
    region,
    bucket,
    credentials,
    keyPrefix,
    outputFileName,
    parallelLogDownloads
}) {
    const s3 = createS3Client(region, credentials);
    const output = fileOutput(csvFormat);
    
    await output.open(outputFileName);
    try {
        await logFetcher({
            output,
            logStore: {
                list: listBucket(s3, { Bucket: bucket, Prefix: keyPrefix }),
                get: getLog(s3, bucket, logConverter(parseS3Log))
            },
            parallelLogGets: parallelLogDownloads
        });
    } finally {
        await output.close();
    }
}

module.exports = run;

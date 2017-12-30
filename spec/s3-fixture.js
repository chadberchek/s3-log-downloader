'use strict';

const https = require('https');
const AWS = require('aws-sdk');
const testConfig = require('../test-config.js');

function createS3Client() {
    const params = {
        httpOptions: { 
            agent: new https.Agent({keepAlive: true, keepAliveMsecs: 1000})
        },
        apiVersion: '2006-03-01'
    };
    if (testConfig.region) params.region = testConfig.region;
    if (testConfig.credentials) params.credentials = testConfig.credentials;
    return new AWS.S3(params);
}

function createS3Fixture(specDescriptionPrefix, objects, beforeFn, afterFn) {
    const fixture = {
        listObjects() {
            return this.client.listObjectsV2({
                Bucket: this.bucket,
                Prefix: this.prefix
            }).promise();
        }
    };

    beforeFn(() => {
        if (!testConfig.bucket) {
            throw new Error('Test bucket name not configured');
        }

        fixture.prefix = 'test-' + specDescriptionPrefix + new Date().toISOString().replace(/:/g, '-') + '/';
        fixture.client = createS3Client();
        fixture.bucket = testConfig.bucket;
        fixture.testObjectKeys = objects.map(o => fixture.prefix + o.key);

        return Promise.all(objects.map(o => 
            fixture.client.putObject({Key: fixture.prefix + o.key, Body: o.body, Bucket: fixture.bucket}).promise()
        ));
    });

    afterFn(() => {
        return fixture.client.deleteObjects({
            Bucket: fixture.bucket,
            Delete: {
                Objects: fixture.testObjectKeys.map(k => ({Key: k})),
                Quiet: true
            }
        }).promise();
    });

    return fixture;
}

module.exports.forEachSpec = function(specDescriptionPrefix, objects) {
    return createS3Fixture(specDescriptionPrefix, objects, beforeEach, afterEach);
}

module.exports.forAllSpecs = function(specDescriptionPrefix, objects) {
    return createS3Fixture(specDescriptionPrefix, objects, beforeAll, afterAll);
}

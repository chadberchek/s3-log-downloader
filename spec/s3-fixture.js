'use strict';

const testConfigFile = 'test-config.js';
const https = require('https');
const AWS = require('aws-sdk');
const testConfig = require('../' + testConfigFile);

function testConfigParam(paramName) {
    if (!testConfig[paramName]) {
        throw new Error(`AWS test ${paramName} not configured; see ${testConfigFile}`);        
    }
    return testConfig[paramName];
}

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

function createS3Fixture(specDescriptionPrefix, objects, beforeFn, afterFn) {
    const fixture = {
        listObjects() {
            return this.client.listObjectsV2({
                Bucket: this.bucket,
                Prefix: this.prefix
            }).promise();
        }
    };

    beforeFn(function() {
        fixture.prefix = 'test-' + specDescriptionPrefix + new Date().toISOString().replace(/:/g, '-') + '/';
        fixture.bucket = testConfigParam('bucket');
        fixture.region = testConfigParam('region');
        fixture.credentials = testConfigParam('credentials');
        fixture.client = createS3Client(fixture.region, fixture.credentials);
        fixture.testObjectKeys = objects.map(o => fixture.prefix + o.key);

        return Promise.all(objects.map(o => 
            fixture.client.putObject({Key: fixture.prefix + o.key, Body: o.body, Bucket: fixture.bucket}).promise()
        ));
    });

    afterFn(function() {
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

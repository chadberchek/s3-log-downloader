'use strict';

const {DONE} = require('promise-pull-streams');
const listS3Bucket = require('../lib/list-bucket');
const s3Fixture = require('./s3-fixture');

describe('listS3Bucket', function() {
    const fixture = s3Fixture.forAllSpecs('listS3Bucket', [
        {body: '1',   key: 'ATestObject'},
        {body: 'abc', key: 'BTestObject'},
        {body: 'wd',  key: 'CTestObject'}
    ]);
    
    it('lists each page of objects until there are no more', async function() {
        const originalParams = {
            Bucket: fixture.bucket,
            Prefix: fixture.prefix,
            MaxKeys: 2
        };
        const copyOfParams = Object.assign({}, originalParams);
        const listingPromiseFactory = listS3Bucket(fixture.client, copyOfParams);

        expect(await listingPromiseFactory()).toEqual([
            fixture.testObjectKeys[0],
            fixture.testObjectKeys[1]
        ]);

        expect(await listingPromiseFactory()).toEqual([
            fixture.testObjectKeys[2]
        ]);

        try {
            await listingPromiseFactory();
            fail('should have rejected with DONE');
        } catch (e) {
            expect(e).toBe(DONE);
        }

        expect(copyOfParams).toEqual(originalParams);
    });
});

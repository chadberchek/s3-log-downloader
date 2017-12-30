'use strict';

const {DONE} = require('promise-pull-streams');
const listS3Bucket = require('../lib/list-bucket');
const s3Fixture = require('./s3-fixture');

describe('listS3Bucket', () => {
    const fixture = s3Fixture.forAllSpecs('listS3Bucket', [
        {body: '1',   key: 'ATestObject'},
        {body: 'abc', key: 'BTestObject'},
        {body: 'wd',  key: 'CTestObject'}
    ]);
    
    it('lists each page of objects until there are no more', async () => {
        const originalParams = {
            Bucket: fixture.bucket,
            Prefix: fixture.prefix,
            MaxKeys: 2
        };
        const copyOfParams = Object.assign({}, originalParams);
        const listingPromiseFactory = listS3Bucket(fixture.client, copyOfParams);

        expect(await listingPromiseFactory()).toEqual([
            jasmine.objectContaining({ Key: fixture.testObjectKeys[0], Size: 1 }),
            jasmine.objectContaining({ Key: fixture.testObjectKeys[1], Size: 3 })
        ]);

        expect(await listingPromiseFactory()).toEqual([
            jasmine.objectContaining({ Key: fixture.testObjectKeys[2], Size: 2})
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

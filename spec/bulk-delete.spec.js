'use strict';

const s3BulkDelete = require('../lib/bulk-delete');
const s3Fixture = require('./s3-fixture');

describe('s3BulkDelete', function() {
    const fixture = s3Fixture.forEachSpec('s3BulkDelete', [
        {key: 'ATestObject', body: 'A'},
        {key: 'BTestObject', body: 'B'},
        {key: 'CTestObject', body: 'C'}
    ]);

    it('deletes specified objects', async function() {        
        await s3BulkDelete(fixture.client, fixture.bucket)([
            { key: fixture.testObjectKeys[0] },
            { key: fixture.testObjectKeys[2] } 
        ]);

        const objectListing = await fixture.listObjects();

        expect(objectListing.Contents.length).toBe(1);
        expect(objectListing.Contents[0].Key).toBe(fixture.testObjectKeys[1]);
    });
});

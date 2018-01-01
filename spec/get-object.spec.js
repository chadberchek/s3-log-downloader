'use strict';

const getObject = require('../lib/get-object');
const s3Fixture = require('./s3-fixture');

describe('get object', () => {
    const fixture = s3Fixture.forEachSpec('get-object', [
        { key: 'something', body: 'the content' }
    ]);

    it('downloads the object', async () => {
        const object = await getObject(fixture.client, fixture.bucket)(fixture.testObjectKeys[0]);
        expect(object).toEqual({
            key: fixture.testObjectKeys[0],
            body: 'the content'
        });
    });
});

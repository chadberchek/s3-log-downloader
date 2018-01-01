'use strict';

const getLog = require('../lib/get-log');
const s3Fixture = require('./s3-fixture');

describe('get log', () => {
    const fixture = s3Fixture.forEachSpec('get-log', [
        { key: 'something', body: 'the content' }
    ]);

    it('downloads the object and converts it to log data model using given converter', async () => {
        const convert = jasmine.createSpy('convert').and.returnValue('log data model');
        const log = await getLog(fixture.client, fixture.bucket, convert)(fixture.testObjectKeys[0]);
        expect(convert).toHaveBeenCalledWith({ key: fixture.testObjectKeys[0], body: 'the content' });
        expect(log).toBe('log data model');
    });
});

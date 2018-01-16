'use strict';

const path = require('path');
const fs = require('fs');
const util = require('util');
const os = require('os');
const run = require('../lib/run');
const s3Fixture = require('./s3-fixture');

const readFile = util.promisify(fs.readFile);
const unlink = util.promisify(fs.unlink);

describe('run', () => {
    const log0Content = 
            'bf766c5420f2dcb65665b0a97563133 zTestBucket.a [27/Apr/2016:03:58:24 +0000] 16.5.31.180 - D04E408645828411 WEBSITE.GET.OBJECT main/index.html "GET /main/index.html HTTP/1.1" 200 - 16700 16700 14 14 "http://zTestBucket.a.s3-website-us-east-1.amazonaws.com/main/index.html" "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.112 Safari/537.36" -\n' +
            'cccccc5420f2dcb65665b0a97563133 zTestBucket.a [25/Jun/2016:13:01:56 +0000] 17.86.2.8 arn:aws:iam::123456789:user/bob CAD1C1CB85A07AA5 REST.PUT.OBJECT ra.png "PUT /zTestBucket.a/ra.png?X-Amz-Stuff=abc123 HTTP/1.1" 200 - - 121 20 8 "-" "S3Console/0.4" -\n';
    const log1Content = 
            'aaaaaa5420f2dcb65665b0a97563133 zTestBucket.a [10/Jan/2017:03:58:18 +0000] 150.12.77.175 - E812F5100226A76C WEBSITE.GET.OBJECT vt.png "GET /vt.png HTTP/1.1" 304 - - 2392 4 - "http://zTestBucket.a.s3-website-us-east-1.amazonaws.com/vt.png" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2486.0 Safari/537.36 Edge/13.10586" -\n';

    const fixture = s3Fixture.forEachSpec('logFetcherRun', [
        { key: 'log0', body: log0Content },
        { key: 'log1', body: log1Content }
    ]);

    beforeEach(() => {
        this.runParams = {
            region: fixture.region,
            bucket: fixture.bucket,
            credentials: fixture.credentials,
            keyPrefix: fixture.prefix,
            outputFileName: path.join(os.tmpdir(), 'logFetcherTest-' + Date.now()),
            parallelLogDownloads: 2,
        };
    });

    afterEach(() => unlink(this.runParams.outputFileName));
    
    it('downloads, parses and saves logs as CSV', async () => {
        await run(this.runParams);
        const result = await readFile(this.runParams.outputFileName, 'utf8');       
        expect(result).toContain(
            `"${fixture.prefix}log0",0,"bf766c5420f2dcb65665b0a97563133","zTestBucket.a",2016-04-27T03:58:24.000Z,"16.5.31.180",,"D04E408645828411","WEBSITE.GET.OBJECT","main/index.html","GET /main/index.html HTTP/1.1",200,,16700,16700,14,14,"http://zTestBucket.a.s3-website-us-east-1.amazonaws.com/main/index.html","Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.112 Safari/537.36",,"GET","/main/index.html",,"HTTP/1.1"\r\n` +
            `"${fixture.prefix}log0",1,"cccccc5420f2dcb65665b0a97563133","zTestBucket.a",2016-06-25T13:01:56.000Z,"17.86.2.8","arn:aws:iam::123456789:user/bob","CAD1C1CB85A07AA5","REST.PUT.OBJECT","ra.png","PUT /zTestBucket.a/ra.png?X-Amz-Stuff=abc123 HTTP/1.1",200,,0,121,20,8,,"S3Console/0.4",,"PUT","/zTestBucket.a/ra.png","X-Amz-Stuff=abc123","HTTP/1.1"\r\n`
        );
        expect(result).toContain(
            `"${fixture.prefix}log1",0,"aaaaaa5420f2dcb65665b0a97563133","zTestBucket.a",2017-01-10T03:58:18.000Z,"150.12.77.175",,"E812F5100226A76C","WEBSITE.GET.OBJECT","vt.png","GET /vt.png HTTP/1.1",304,,0,2392,4,,"http://zTestBucket.a.s3-website-us-east-1.amazonaws.com/vt.png","Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2486.0 Safari/537.36 Edge/13.10586",,"GET","/vt.png",,"HTTP/1.1"\r\n`
        );

        // Should not delete objects
        expect((await fixture.listObjects()).Contents.length).toBe(fixture.testObjectKeys.length);
    });

    it('deletes original logs if delete parameter is true', async () => {
        this.runParams.deleteOriginalLogs = true;
        await run(this.runParams);
        expect((await fixture.listObjects()).Contents).toEqual([]);
    }); 
});

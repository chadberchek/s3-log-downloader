'use strict';

const CsvFileOutput = require('../lib/file-output');
const fs = require('fs');
const os = require('os');
const path = require('path');
const util = require('util');

const access = util.promisify(fs.access);
const unlink = util.promisify(fs.unlink);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

describe('CsvFileOutput', () => {
    it('writes file', async () => {
        const log = {
            logKey: "root/log-file-name",
            logEntries: [{
                bucketOwner: 'PPL4',
                bucket: 'www.site.com',
                time: new Date(Date.UTC(2017, 10, 6, 22, 38, 11)),
                remoteIp: '192.168.1.58',
                requester: 'ANONYMOUS',
                requestId: 'RQID123',
                operation: 'WEBSITE.GET.OBJECT',
                key: 'index.html',
                requestUri: "GET /mybucket?versioning HTTP/1.1",
                httpStatus: 200,
                errorCode: 'none',
                bytesSent: 57,
                objectSize: 100,
                totalTime: 33,
                turnAroundTime: 20,
                referrer: 'https://www.google.com/?abc',
                userAgent: 'Test/Agent',
                versionId: 'v1',
                httpMethod: 'GET',
                pathname: '/index.html',
                queryString: 'versioning',
                httpVersion: 'HTTP/1.1',
            }]
        };

        const testFileName = path.join(os.tmpdir(), 'csvFileOutputTest-' + Date.now());
        
        const file = new CsvFileOutput();
        await file.open(testFileName);
        await access(testFileName);
        await file.write(log);
        await file.commit();
        expect(await readFile(testFileName, 'utf8')).toBe(
            `"root/log-file-name",0,"PPL4","www.site.com",2017-11-06T22:38:11.000Z,"192.168.1.58","ANONYMOUS","RQID123","WEBSITE.GET.OBJECT","index.html","GET /mybucket?versioning HTTP/1.1",200,"none",57,100,33,20,"https://www.google.com/?abc","Test/Agent","v1","GET","/index.html","versioning","HTTP/1.1"\r\n`
        );        
        await file.close();
        await unlink(testFileName);
    });

    it('does not overwrite files', async () => {
        const testFileName = path.join(os.tmpdir(), 'csvFileOutputTest2-' + Date.now());
        await writeFile(testFileName, '');

        const file = new CsvFileOutput();
        try {
            await file.open(testFileName);
            fail('Expected error attempting to open existing file for writing');
        } catch (e) {
            expect(e.code).toBe('EEXIST');
        }

       await unlink(testFileName);
    });
});

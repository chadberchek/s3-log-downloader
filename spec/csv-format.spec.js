'use strict';

const csv = require('../lib/csv-format');

describe("S3 log to CSV", () => {
    let entry0, entry1;

    beforeEach(() => {
        entry0 = {
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
        };
    
        entry1 = {
            bucketOwner: 'PPL3',
            bucket: 'www.site.org',
            time: new Date(Date.UTC(2011, 10, 1, 22, 8, 7)),
            remoteIp: '192.168.1.2',
            requester: 'HGFW3',
            requestId: 'RQID55',
            operation: 'REST.POST.OBJECT',
            key: 'abn.html',
            requestUri: "POST /abn.html HTTP/1.0",
            httpStatus: 401,
            errorCode: null,
            bytesSent: 122,
            objectSize: 122,
            totalTime: 102,
            turnAroundTime: 90,
            referrer: null,
            userAgent: 'Test/Agent2',
            versionId: null,
            httpMethod: 'POST',
            pathname: '/abn.html',
            queryString: null,
            httpVersion: 'HTTP/1.0',
        };
    });

    it("produces quoted, comma-separated, CRLF-delimited string", () => {
        const result = csv({
            logKey: "root/log-file-name",
            logEntries: [entry0]
        });

        expect(result).toBe(
            `"root/log-file-name",0,"PPL4","www.site.com",2017-11-06T22:38:11.000Z,"192.168.1.58","ANONYMOUS","RQID123","WEBSITE.GET.OBJECT","index.html","GET /mybucket?versioning HTTP/1.1",200,"none",57,100,33,20,"https://www.google.com/?abc","Test/Agent","v1","GET","/index.html","versioning","HTTP/1.1"\r\n`
        );
    });

    it("converts null or undefined properties to unquoted empty strings", () => {
        delete entry1.referrer; // make an undefined property

        const result = csv({
            logKey: "root/log-file-name",
            logEntries: [entry1]
        });

        expect(result).toBe(
            `"root/log-file-name",0,"PPL3","www.site.org",2011-11-01T22:08:07.000Z,"192.168.1.2","HGFW3","RQID55","REST.POST.OBJECT","abn.html","POST /abn.html HTTP/1.0",401,,122,122,102,90,,"Test/Agent2",,"POST","/abn.html",,"HTTP/1.0"\r\n`
        );
    });

    it("includes 0-based line number as second field", () => {
        const result = csv({
            logKey: "root/log-file-name",
            logEntries: [entry0, entry1]
        });

        expect(result).toBe(
            `"root/log-file-name",0,"PPL4","www.site.com",2017-11-06T22:38:11.000Z,"192.168.1.58","ANONYMOUS","RQID123","WEBSITE.GET.OBJECT","index.html","GET /mybucket?versioning HTTP/1.1",200,"none",57,100,33,20,"https://www.google.com/?abc","Test/Agent","v1","GET","/index.html","versioning","HTTP/1.1"\r\n` +
            `"root/log-file-name",1,"PPL3","www.site.org",2011-11-01T22:08:07.000Z,"192.168.1.2","HGFW3","RQID55","REST.POST.OBJECT","abn.html","POST /abn.html HTTP/1.0",401,,122,122,102,90,,"Test/Agent2",,"POST","/abn.html",,"HTTP/1.0"\r\n`
        );
    });

    it("doubles quotes in values", () => {
        entry0.bucketOwner = 'P"PL4';
        entry0.requester = 'A"NONYMOUS';
        entry0.requestId = 'RQ"ID123';
        entry0.operation = 'WEB"SITE.GET.OBJECT';
        entry0.errorCode = 'n"one';
        entry0.userAgent = 'Test/"Agen"t';

        const result = csv({
            logKey: 'log"with"weird"name',
            logEntries: [entry0]
        });

        expect(result).toBe(
            `"log""with""weird""name",0,"P""PL4","www.site.com",2017-11-06T22:38:11.000Z,"192.168.1.58","A""NONYMOUS","RQ""ID123","WEB""SITE.GET.OBJECT","index.html","GET /mybucket?versioning HTTP/1.1",200,"n""one",57,100,33,20,"https://www.google.com/?abc","Test/""Agen""t","v1","GET","/index.html","versioning","HTTP/1.1"\r\n`
        );
    });

    it("outputs 0 as field value not emptry string", () => {
        entry0.bytesSent = 0;

        const result = csv({
            logKey: "root/log-file-name",
            logEntries: [entry0]
        });

        expect(result).toBe(
            `"root/log-file-name",0,"PPL4","www.site.com",2017-11-06T22:38:11.000Z,"192.168.1.58","ANONYMOUS","RQID123","WEBSITE.GET.OBJECT","index.html","GET /mybucket?versioning HTTP/1.1",200,"none",0,100,33,20,"https://www.google.com/?abc","Test/Agent","v1","GET","/index.html","versioning","HTTP/1.1"\r\n`
        );
    });

    it("returns empty string if there are no log entries", () => {
        const result = csv({logKey: "logfile", logEntries: []});

        expect(result).toBe('');
    });
});

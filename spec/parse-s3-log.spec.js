'use strict';

const {parseS3Log, S3LogFormatError} = require('../lib/parse-s3-log');

describe('S3 log parser', function() {
    it('parses fields and converts dash to null', function() {
        const entries = parseS3Log('abc123 mybucket [06/Feb/2014:00:00:38 +0000] 192.0.2.3 def322 3E57427F3EXAMPLE REST.GET.VERSIONING - "GET /mybucket?versioning HTTP/1.1" 200 - 113 - 7 - "-" "S3Console/0.4" -');

        expect(entries.length).toBe(1);
        const e = entries[0];
        expect(e.bucketOwner).toBe('abc123');
        expect(e.bucket).toBe('mybucket');
        expect(e.time.toISOString()).toBe('2014-02-06T00:00:38.000Z');
        expect(e.remoteIp).toBe('192.0.2.3');
        expect(e.requester).toBe('def322');
        expect(e.requestId).toBe('3E57427F3EXAMPLE');
        expect(e.operation).toBe('REST.GET.VERSIONING');
        expect(e.key).toBeNull();
        expect(e.requestUri).toBe("GET /mybucket?versioning HTTP/1.1");
        expect(e.httpStatus).toBe(200);
        expect(e.errorCode).toBeNull();
        expect(e.bytesSent).toBe(113);
        expect(e.objectSize).toBeNull();
        expect(e.totalTime).toBe(7);
        expect(e.turnAroundTime).toBeNull();
        expect(e.referrer).toBeNull();
        expect(e.userAgent).toBe("S3Console/0.4");
        expect(e.versionId).toBeNull();
        expect(e.httpMethod).toBe('GET');
        expect(e.pathname).toBe('/mybucket');
        expect(e.queryString).toBe('versioning');
        expect(e.httpVersion).toBe('HTTP/1.1');
    });

    it('sets query string to null if no query string present', function() {
        const entries = parseS3Log('abc123 mybucket [06/Feb/2014:00:00:38 +0000] 192.0.2.3 def322 3E57427F3EXAMPLE REST.GET.VERSIONING - "GET /mybucket HTTP/1.1" 200 - 113 - 7 - "-" "S3Console/0.4" -');
        expect(entries[0].queryString).toBeNull();
    });

    it('parses static web access entry', function() {
        const entries = parseS3Log('a64e21fba3059a23bf6c0 example.com [27/Apr/2016:03:58:01 +0100] 66.86.131.1 - TESTE4E7FC899572 WEBSITE.GET.OBJECT h2wedge.png "GET /h2wedge.png HTTP/1.0" 200 - 130 130 13 13 "http://example.com.s3-website-us-east-1.amazonaws.com/v321.css" "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.112 Safari/537.36" -');

        expect(entries.length).toBe(1);
        const e = entries[0];
        expect(e.bucketOwner).toBe('a64e21fba3059a23bf6c0');
        expect(e.bucket).toBe('example.com');
        expect(e.time.toISOString()).toBe('2016-04-27T02:58:01.000Z');
        expect(e.remoteIp).toBe('66.86.131.1');
        expect(e.requester).toBeNull();
        expect(e.requestId).toBe('TESTE4E7FC899572');
        expect(e.operation).toBe('WEBSITE.GET.OBJECT');
        expect(e.key).toBe('h2wedge.png');
        expect(e.requestUri).toBe("GET /h2wedge.png HTTP/1.0");
        expect(e.httpStatus).toBe(200);
        expect(e.errorCode).toBeNull();
        expect(e.bytesSent).toBe(130);
        expect(e.objectSize).toBe(130);
        expect(e.totalTime).toBe(13);
        expect(e.turnAroundTime).toBe(13);
        expect(e.referrer).toBe("http://example.com.s3-website-us-east-1.amazonaws.com/v321.css");
        expect(e.userAgent).toBe("Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.112 Safari/537.36");
        expect(e.versionId).toBeNull();
        expect(e.httpMethod).toBe('GET');
        expect(e.pathname).toBe('/h2wedge.png');
        expect(e.queryString).toBeNull();
        expect(e.httpVersion).toBe('HTTP/1.0');
    });

    it('parses error code and version ID fields', function() {
        const entries = parseS3Log('a64e21fba3059a23bf6c0 example.com [27/Apr/2016:03:58:01 +0100] 66.86.131.1 - TESTE4E7FC899572 WEBSITE.GET.OBJECT h2wedge.png "GET /h2wedge.png HTTP/1.0" 404 oops 130 130 13 13 "http://example.com.s3-website-us-east-1.amazonaws.com/v321.css" "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.112 Safari/537.36" v1234');
        
        expect(entries[0].versionId).toBe('v1234');
        expect(entries[0].errorCode).toBe('oops');
    });

    it('treats missing bytes sent field as 0', function() {
        const entries = parseS3Log('abc example.com [27/Apr/2016:03:58:01 +0100] 66.86.131.1 - TESTE4E7FC899572 WEBSITE.GET.OBJECT h2wedge.png "GET /h2wedge.png HTTP/1.0" 200 - - 130 13 13 "-" "Mozilla/5.0" -');
        expect(entries[0].bytesSent).toBe(0);
    });

    it('parses multiple lines as individual entries with LF or CRLF line ending', function() {
        const entries = parseS3Log(
            'abc example.com [27/Apr/2016:03:58:01 +0000] 166.86.131.1 - DFF WEBSITE.GET.OBJECT h2wedge.png "GET /h2wedge.png HTTP/1.1" 200 - 130 130 13 13 "-" "Mozilla/5.0" -\n' +
            'abc example.com [27/Apr/2016:03:58:01 +0000] 166.86.131.2 - EFF WEBSITE.GET.OBJECT bkg.png "GET /bkg.png HTTP/1.1" 200 - 250 250 18 17 "-" "Mozilla/5.0" -\r\n' +
            'abc example.com [27/Apr/2016:03:58:01 +0000] 166.86.131.3 - WEF WEBSITE.GET.OBJECT index.html "GET / HTTP/1.1" 200 - 5092 5092 65 65 "-" "Mozilla/5.0" -'
        );
        
        expect(entries.length).toBe(3);
        expect(entries[0]).toEqual(jasmine.objectContaining({remoteIp: '166.86.131.1', key: 'h2wedge.png'}));
        expect(entries[1]).toEqual(jasmine.objectContaining({remoteIp: '166.86.131.2', key: 'bkg.png'}));
        expect(entries[2]).toEqual(jasmine.objectContaining({remoteIp: '166.86.131.3', key: 'index.html'}));
    });

    it('omits HTTP method, HTTP version, path name, and query string if request URI is absent', function() {
        const entries = parseS3Log('abc example.com [27/Apr/2016:03:58:01 +0000] 166.86.131.1 - DFF WEBSITE.GET.OBJECT h2wedge.png "-" 200 - 130 130 13 13 "-" "Mozilla/5.0" -');
        
        expect(entries.length).toBe(1);
        expect(entries[0].httpMethod).toBeNull();
        expect(entries[0].httpVersion).toBeNull();
        expect(entries[0].pathname).toBeNull();
        expect(entries[0].queryString).toBeNull();
    });

    it('sets date to null if absent', function() {
        const entries = parseS3Log('abc example.com [-] 166.86.131.1 - DFF WEBSITE.GET.OBJECT h2wedge.png "-" 200 - 130 130 13 13 "-" "Mozilla/5.0" -');
        expect(entries[0].time).toBeNull();       
    });

    it('ignores extra fields', function() {
        const entries = parseS3Log(
            'abc example.com [27/Apr/2016:03:58:01 +0000] 166.86.131.1 - DFF WEBSITE.GET.OBJECT h2wedge.png "GET /h2wedge.png HTTP/1.1" 200 - 130 130 13 13 "-" "Mozilla/5.0" - something [123] "newfield"\n' +
            'abc example.com [27/Apr/2016:03:58:01 +0000] 166.86.131.2 - EFF WEBSITE.GET.OBJECT bkg.png "GET /bkg.png HTTP/1.1" 200 - 250 250 18 17 "-" "Mozilla/5.0" v1 ok'
        );
        
        expect(entries.length).toBe(2);
        expect(entries[0].userAgent).toBe("Mozilla/5.0");
        expect(entries[0].versionId).toBeNull();
        expect(entries[1].bucketOwner).toBe('abc');
        expect(entries[1].versionId).toBe('v1');
    });

    it('ignores blank lines', function() {
        const entries = parseS3Log(
            'abc example.com [27/Apr/2016:03:58:01 +0000] 166.86.131.1 - DFF WEBSITE.GET.OBJECT h2wedge.png "GET /h2wedge.png HTTP/1.1" 200 - 130 130 13 13 "-" "Mozilla/5.0" -\n' +
            '\n' +
            '\r\n' +
            'abc example.com [27/Apr/2016:03:58:01 +0000] 166.86.131.2 - EFF WEBSITE.GET.OBJECT bkg.png "GET /bkg.png HTTP/1.1" 200 - 250 250 18 17 "-" "Mozilla/5.0" -\n'
        );
        
        expect(entries.length).toBe(2);
        expect(entries[0].key).toBe('h2wedge.png');
        expect(entries[1].key).toBe('bkg.png');
    });

    it('throws excpetion if line format does not match spec', function() {
        expect(() => parseS3Log('abc example.com 27/Apr/2016:03:58:01 +0000 166.86.131.1 - DFF WEBSITE.GET.OBJECT h2wedge.png "GET /h2wedge.png HTTP/1.1" 200 - 130 130 13 13 "-" "Mozilla/5.0" -'))
                .toThrowError(S3LogFormatError);
    });

    it('throws exception if time format is invalid', function() {
        expect(() => parseS3Log('abc example.com [Apr/2016 03:58:01 +0000] 166.86.131.1 - DFF WEBSITE.GET.OBJECT h2wedge.png "GET /h2wedge.png HTTP/1.1" 200 - 130 130 13 13 "-" "Mozilla/5.0" -'))
                .toThrowError(S3LogFormatError);
    });

    it('throws exception if request URI does not have 3 space delimited parts', function() {
        expect(() => parseS3Log('abc example.com [27/Apr/2016:03:58:01 +0100] 66.86.131.1 - TESTE4E7FC899572 WEBSITE.GET.OBJECT h2wedge.png "GET/h2wedge.png HTTP/1.0" 200 - 130 130 13 13 "-" "Mozilla/5.0" -'))
                .toThrowError(S3LogFormatError);
    });

    it('throws exception if number cannot be parsed', function() {
        expect(() => parseS3Log('abc example.com [27/Apr/2016:03:58:01 +0100] 66.86.131.1 - TESTE4E7FC899572 WEBSITE.GET.OBJECT h2wedge.png "GET /h2wedge.png HTTP/1.0" OK - 130 130 13 13 "-" "Mozilla/5.0" -'))
                .toThrowError(S3LogFormatError);
    });
});

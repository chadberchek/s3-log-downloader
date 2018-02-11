'use strict';

const convert = require('../lib/convert-log');

describe('convert-log', function() {
    it('includes key in log data model', function() {
        const parser = jasmine.createSpy('parser').and.returnValue([]);
        const logData = convert(parser)({ key: 'log0', body: 'log body'});
        expect(logData.key).toBe('log0');
    });

    it('converts log body to entry objects using given parser', function() {
        const parser = jasmine.createSpy('parser').and.returnValue([{ a: 1 }]);
        const logData = convert(parser)({ key: 'log0', body: 'log body'});
        expect(parser).toHaveBeenCalledWith('log body');
        expect(logData.body).toEqual([jasmine.objectContaining({a: 1})]);
    });

    it('adds log file name and line number to each entry', function() {
        const parser = jasmine.createSpy('parser').and.returnValue([{}, {}]);
        const logData = convert(parser)({ key: 'log0', body: 'log body'});
        expect(logData.body).toEqual([
            jasmine.objectContaining({ logFileName: 'log0', lineNumber: 0 }),
            jasmine.objectContaining({ logFileName: 'log0', lineNumber: 1 })
        ]);
    });
});

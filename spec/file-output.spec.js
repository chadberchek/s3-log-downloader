'use strict';

const fileOutput = require('../lib/file-output');
const fs = require('fs');
const os = require('os');
const path = require('path');
const util = require('util');

const access = util.promisify(fs.access);
const unlink = util.promisify(fs.unlink);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

describe('FileOutput', function() {
    it('writes file', async function() {
        const log = {
            key: 'some log',
            body: 'the log content'
        };
        const testFileName = path.join(os.tmpdir(), 'fileOutputTest-' + Date.now());
        const format = x => x + ' formatted';
        
        const file = fileOutput(format);
        await file.open(testFileName);
        await access(testFileName);
        await file.write(log);
        await file.commit();
        expect(await readFile(testFileName, 'utf8')).toBe('the log content formatted');
        await file.close();
        await unlink(testFileName);
    });

    it('does not overwrite files', async function() {
        const testFileName = path.join(os.tmpdir(), 'fileOutputTest2-' + Date.now());
        await writeFile(testFileName, '');

        const file = fileOutput(x => x);
        try {
            await file.open(testFileName);
            fail('Expected error attempting to open existing file for writing');
        } catch (e) {
            expect(e.code).toBe('EEXIST');
        }

       await unlink(testFileName);
    });
});

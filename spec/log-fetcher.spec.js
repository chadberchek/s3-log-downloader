'use strict';

const logFetcher = require('../lib/log-fetcher');
const {DONE} = require('promise-pull-streams');
const {Deferred, promiseHandlersCalled} = require('./test-util');

describe('log fetcher', () => {
    beforeEach(() => {
        this.params = {
            logStore: jasmine.createSpyObj('logStore', ['list', 'get', 'delete']),
            output: jasmine.createSpyObj('output', ['write', 'commit']),
            parallelLogGets: 1,
        };
        this.setMockLogList = function(...listingPages) {
            const itr = listingPages[Symbol.iterator]();
            this.params.logStore.list.and.callFake(() => {
                const next = itr.next();
                return next.done ? Promise.reject(DONE) : Promise.resolve(next.value);
            });
        };
        this.deleteWithBatchSize = function(batchSize) {
            this.params.deleteOriginalLogs = true;
            this.params.deleteBatchSize = batchSize;
        };
        this.params.logStore.get.and.callFake(logName => Promise.resolve(logName + ' data model'));
        this.params.output.write.and.returnValue(Promise.resolve());
        this.params.output.commit.and.returnValue(Promise.resolve());
        this.testAsyncOperationsAreSequential = async function(op1, op2) {
            const op1Deferrals = Deferred.stub(op1);

            logFetcher(this.params);
            await promiseHandlersCalled();
            expect(op1).toHaveBeenCalledTimes(1);
            if (op2) {
                expect(op2).not.toHaveBeenCalled();
            }

            op1Deferrals[0].resolve();
            await promiseHandlersCalled();
            if (op2) {
                expect(op2).toHaveBeenCalledTimes(1);                    
            } else {
                expect(op1).toHaveBeenCalledTimes(2);
            }
        };
    });

    it('lists logs, gets each one, and writes it to the output', async () => {
        this.setMockLogList(['log0', 'log1'], ['log2']);
        
        await logFetcher(this.params);

        expect(this.params.output.write).toHaveBeenCalledWith('log0 data model');
        expect(this.params.output.write).toHaveBeenCalledWith('log1 data model');
        expect(this.params.output.write).toHaveBeenCalledWith('log2 data model');
        expect(this.params.output.write).toHaveBeenCalledTimes(3);
    });

    it('commits the output and deletes the logs if delete flag is true', async () => {
        this.deleteWithBatchSize(10);
        this.setMockLogList(['log0', 'log1'], ['log2']);

        await logFetcher(this.params);

        expect(this.params.output.commit).toHaveBeenCalledTimes(1);
        expect(this.params.logStore.delete).toHaveBeenCalledTimes(1);
        expect(this.params.logStore.delete).toHaveBeenCalledWith(['log0 data model', 'log1 data model', 'log2 data model']);
    });

    it('does not delete logs if delete flag not set', async () => {
        this.params.deleteBatchSize = 10;
        this.setMockLogList(['a']);

        await logFetcher(this.params);

        expect(this.params.output.commit).not.toHaveBeenCalled();
        expect(this.params.logStore.delete).not.toHaveBeenCalled();
    });

    it('deletes logs in batches of specified size', async () => {
        this.setMockLogList(['a', 'b', 'c']);
        this.deleteWithBatchSize(2);

        await logFetcher(this.params);

        expect(this.params.output.commit).toHaveBeenCalledTimes(2);
        expect(this.params.logStore.delete).toHaveBeenCalledTimes(2);
        expect(this.params.logStore.delete).toHaveBeenCalledWith(['a data model', 'b data model']);
        expect(this.params.logStore.delete).toHaveBeenCalledWith(['c data model']);
    });

    it('commits output before deleting originals', async () => {
        this.setMockLogList(['a']);
        this.deleteWithBatchSize(1);
        await this.testAsyncOperationsAreSequential(this.params.output.commit, this.params.logStore.delete);
    });

    it('writes log before committing output', async () => {
        this.setMockLogList(['a']);
        this.deleteWithBatchSize(1);
        await this.testAsyncOperationsAreSequential(this.params.output.write, this.params.output.commit);
    });

    it('waits for deletion to complete before starting another deletion', async () => {
        this.setMockLogList(['a', 'b']);
        this.deleteWithBatchSize(1);
        await this.testAsyncOperationsAreSequential(this.params.logStore.delete);
    });

    it('can get logs in parallel', async () => {
        this.params.parallelLogGets = 2;
        this.setMockLogList(['a', 'b', 'c']);
        const getLogDeferrals = Deferred.stub(this.params.logStore.get);
        Deferred.stub(this.params.output.write); // write is not immediate; need adequate buffer

        logFetcher(this.params);
        await promiseHandlersCalled();
        expect(this.params.logStore.get).toHaveBeenCalledTimes(this.params.parallelLogGets);
        getLogDeferrals[0].resolve('log a');
        await promiseHandlersCalled();
        expect(this.params.logStore.get).toHaveBeenCalledTimes(this.params.parallelLogGets + 1);
    });

    it('does not write output in parallel', async () => {
        this.params.parallelLogGets = 2;
        this.setMockLogList(['a', 'b']) ;
        await this.testAsyncOperationsAreSequential(this.params.output.write);
    });
});

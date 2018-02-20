'use strict';

const Stream = require('promise-pull-streams');

function fetchLogs(params) {
    return Stream.pull(
        params.logStore.list,
        Stream.buffer(1),
        Stream.flattenIterable,
        Stream.parallelWrapper({ parallelOperations: params.parallelLogGets, completedFirst: true }, 
            Stream.then(params.logStore.get)),
        Stream.passThrough(params.output.write),
        params.deleteOriginalLogs ? Stream.partialPipe(
            Stream.batch({size: params.deleteBatchSize}),
            Stream.passThrough(params.output.commit),
            Stream.parallelWrapper({ parallelOperations: params.parallelDeleteBatches || 1 },
                Stream.then(params.logStore.delete))
        ) : Stream.identity,
        Stream.consume
    );
}

module.exports = fetchLogs;

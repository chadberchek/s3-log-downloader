'use strict';

const Stream = require('promise-pull-streams');

function fetchLogs(params) {
    let stream = Stream.pull(
        params.logStore.list,
        Stream.buffer(1),
        Stream.flattenIterable,
        Stream.parallelWrapper({ parallelOperations: params.parallelLogGets,  completedFirst: true }, 
            Stream.then(params.logStore.get)),
        Stream.passThrough(params.output.write)
    );

    if (params.deleteOriginalLogs) {
        stream = Stream.pull(stream,
            Stream.batch(params.deleteBatchSize),
            Stream.passThrough(params.output.commit),
            Stream.parallelWrapper({ parallelOperations: params.parallelDeleteBatches || 1 },
                Stream.then(params.logStore.delete))
        );
    }

    return Stream.consume(stream);
}

module.exports = fetchLogs;

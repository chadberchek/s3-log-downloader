'use strict';

const Stream = require('promise-pull-streams');

function fetchLogs(params) {
    let stream = Stream.pull(
        params.logStore.list,
        Stream.buffer(1),
        Stream.flattenIterable,
        Stream.unparallel,
        Stream.then(params.logStore.get),
        Stream.completedFirst,
        Stream.parallel(params.parallelLogGets),
        Stream.passThrough(params.output.write)
    );

    if (params.deleteOriginalLogs) {
        stream = Stream.pull(stream,
            Stream.batch(params.deleteBatchSize),
            Stream.passThrough(params.output.commit),
            Stream.then(params.logStore.delete)            
        );
    }

    return Stream.consume(stream);
}

module.exports = fetchLogs;

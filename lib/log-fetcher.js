'use strict';

const Stream = require('promise-pull-streams');

function fetchLogs(params) {
    let stream = Stream.pull(
        params.logStore.list,
        Stream.flattenIterable,
        Stream.then(params.logStore.get),
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

'use strict';

const Stream = require('promise-pull-streams');

function fetchLogs(params) {
    let stream = Stream.pull(
        () => params.logStore.list(),
        Stream.flattenIterable,
        Stream.then(logName => params.logStore.get(logName)),
        Stream.passThrough(log => params.output.write(log))
    );

    if (params.deleteOriginalLogs) {
        stream = Stream.pull(stream,
            Stream.batch(params.deleteBatchSize),
            Stream.then(log =>
                params.output.commit().then(() => params.logStore.delete(log))
                
            )
        );
    }

    return Stream.consume(stream);
}

module.exports = fetchLogs;

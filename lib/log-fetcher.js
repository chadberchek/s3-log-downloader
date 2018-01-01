'use strict';

const Stream = require('promise-pull-streams');

function fetchLogs(params) {
    return Stream.pull(
        params.listObjects,
        Stream.flattenIterable,
        Stream.then(params.getLog),
        Stream.then(log => params.output.write(log)),
        Stream.consume
    );
}

module.exports = fetchLogs;

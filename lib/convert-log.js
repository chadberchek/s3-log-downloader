'use strict';

function convert(parse) {
    return log => {
        const entries = parse(log.body);
        entries.forEach((entry, index) => {
            entry.logFileName = log.key;
            entry.lineNumber = index;
        });
        return {
            key: log.key,
            body: entries
        };
    };
}

module.exports = convert;

'use strict';

function convert(parse) {
    return keyAndBody => {
        const entries = parse(keyAndBody.body);
        entries.forEach((entry, index) => {
            entry.logFileName = keyAndBody.key;
            entry.lineNumber = index;
        });
        return entries;
    };
}

module.exports = convert;

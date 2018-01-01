'use strict';

const {DONE} = require('promise-pull-streams');

module.exports = function(s3, params) {
    const _params = Object.assign({}, params);
    let done = false;    
    return () => {
        if (done) return Promise.reject(DONE);
        return s3.listObjectsV2(_params).promise().then(data => {
            if (data.IsTruncated) _params.ContinuationToken = data.NextContinuationToken;
            else done = true;
            return data.Contents.map(entry => entry.Key);
        });
    };
};

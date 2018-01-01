'use strict';

function getLog(s3, bucket, convert) {
    return key => s3.getObject({
        Bucket: bucket,
        Key: key
    }).promise().then(data => convert({
        key,
        body: data.Body.toString()
    }));
}

module.exports = getLog;

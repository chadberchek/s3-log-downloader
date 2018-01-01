'use strict';

function getObject(s3, bucket) {
    return key => s3.getObject({
        Bucket: bucket,
        Key: key
    }).promise().then(data => ({
        key,
        body: data.Body.toString()
    }));
}

module.exports = getObject;

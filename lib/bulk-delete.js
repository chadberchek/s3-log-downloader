'use strict';

function s3BulkDelete(s3, bucketName, keys) {
    return s3.deleteObjects({
        Bucket: bucketName,
        Delete: {
            Objects: keys.map(k => ({Key: k})),
            Quiet: true
        }
    }).promise();
}


module.exports = s3BulkDelete;

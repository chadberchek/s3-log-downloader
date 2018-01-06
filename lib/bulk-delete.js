'use strict';

function s3BulkDelete(s3, bucketName) {
    return logs => s3.deleteObjects({
        Bucket: bucketName,
        Delete: {
            Objects: logs.map(log => ({Key: log.key})),
            Quiet: true
        }
    }).promise();
}

module.exports = s3BulkDelete;

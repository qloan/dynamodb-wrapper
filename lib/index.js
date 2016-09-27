var AWS   = require('aws-sdk');

module.exports = (awsConfig) => {
    if(awsConfig) {
       AWS.config.update(awsConfig);
    }
    return require('./model');
};

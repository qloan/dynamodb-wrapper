const DB       = require('../../lib');
let joi        = DB.joi;
let LoanSchema = DB.schema({
    region: 'us-west-2'
});

/* Hooks which operate on the plain json of the items would be defined in this file */

var schema = new LoanSchema({
    tableName: process.env.ENV_NAME + '-test',
    key: {
        hash: 'loanId'
    },
    schema: {
        loanId : joi.string().required(),
        personalInformation : joi.object().keys({
            firstName : joi.string().encrypt(),
            lastName  : joi.string().encrypt()
        }),
        foo    : joi.string().required()
    },
    tableDefinition: {
        TableName: process.env.ENV_NAME + '-test',
        AttributeDefinitions: [{
            AttributeName: 'loanId',
            AttributeType: 'S'
        }],
        KeySchema: [{
            AttributeName: 'loanId',
            KeyType: 'HASH'
        }],
        ProvisionedThroughput: {
            ReadCapacityUnits: 3,
            WriteCapacityUnits: 3
        }
    }
});

schema.on('tableExists', (err, tableName, data, cb) => {
    console.log('Table \'' + tableName + '\' exists!');
    console.dir(err);
    console.dir(data);
});

schema.on('encrypt', (rawObj, encryptedFields, cb) => {
    console.log('===ENCRYPT EVENT HANDLER===')
    //console.dir(rawObj)
    console.dir(encryptedFields)
    console.dir(cb)
    console.log('===END EVENT HANDLER===')
    cb();
});

schema.on('decrypt', (rawObj, encryptedFields, cb) => {
    console.log('===DECRYPT EVENT HANDLER===')
    //console.dir(rawObj)
    console.dir(encryptedFields)
    console.dir(cb)
    console.log('===END EVENT HANDLER===')
    cb();
});

module.exports = schema;

var DB = require('./lib')({
    region: 'us-west-2'
});

/* Hooks which operate on the plain json of the items would be defined in this file */
var dbObject = new DB({
    tableName: 'dev-dsmith11-loans',
    key: {
        hash: 'loanId'
    },
    schema: require("./schema")
});

module.exports = function() {
    return dbObject;
};
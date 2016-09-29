var DB = require('./lib')({
    region: 'us-west-2'
});
var dbObject = new DB({
    tableName: 'dev-dsmith11-loans',
    key: {
        hash: 'loanId'
    },
    schema: require("./schema"),
    methods: {
        getFoo: (foo) => {
            return 'Hi, ' + "foo" + '!';
        }
    }
});

module.exports = function() {
    return dbObject;
};
var Loan = require("./Loan");
var instanceOfLoan = new Loan({
    loanId: 1,
    foo: "abc"
});
async.series([
    (next) => {
        instanceOfLoan.create(next);   
    },
    (next) => {
        instanceOfLoan.set("foo", "bar");
        instanceOfLoan.update(next);
    }
])
instanceOfLoan.create(fun)
async.series([
    function(next) {
        Loan.create({
            loanId : '91919',
            foo    : 'YYYYY' 
        }, function(err, data) {
            if(err) {
                return next(err);
            }
            console.log('Added rec...');
            //console.dir(data);
            next();
        });
    },
    function(next) {
        Loan.get({
            loanId: '91919'
        }, (err, data) => {
            if(err) {
                return next(err);
            }
            console.log('Got rec...');
            console.dir(data);
            next();
        });
    },
    function(next) {
        Loan.query({
            KeyConditionExpression: 'loanId = :val',
            ExpressionAttributeValues: {
                ':val': '1'
            }
        }, (err, data) => {
            if(err) {
                return next(err);
            }
            console.log('Ran query...');
            console.dir(data, {depth: 3, colors: true});
            next();
        });
    },
    function(next) {
        function doScan(lastEvaluatedKey) {
            let params = {
                FilterExpression: 'statusCode = :statusCode',
                ExpressionAttributeValues: {
                    ':statusCode': 200
                }
            };
            if(lastEvaluatedKey) {
                params.ExclusiveStartKey = lastEvaluatedKey;
            }
            Loan.scan(params, (err, data) => {
                if(err) {
                    return next(err);
                }
                console.log('Ran scan...');
                console.dir(data, {depth: 3, colors: true});
                if(typeof data.LastEvaluatedKey != "undefined") {
                    doScan(data.LastEvaluatedKey);
                }else {
                    next();
                }
            });
        }
        doScan();
    },
    function(next) {
        Loan.delete({
            loanId: '91919'
        }, (err, data) => {
            if(err) {
                return next(err);
            }
            console.log('Deleted rec...');
            console.dir(data);
            next();
        });
    }
], (err) => {
    if(err) {
        console.error(err);
    }
});
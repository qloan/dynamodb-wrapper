// This is completely untested. Just a proposed API example

/* This is an example of using the Loan object by itself. We would probably only do this in the onboard route. */
var async = require("async");
var Loan = require("./loan/item");
var instanceOfLoan = new Loan({
    loanId: "1",
    foo: "abc",
    personalInformation: {
        firstName: 'Haig'
    }
});
async.series([
    (next) => {
        instanceOfLoan.create(next);
    },
    (next) => {
        instanceOfLoan.set("foo", "bar");
        //instanceOfLoan.set("personalInformation.firstName", "Haig");
        instanceOfLoan.update(next);
    }
], (err) => {
    console.log(err);
});

/* This is an example of using the LoanTable object */
var LoanTable = require("./loan/table");
var loanInstance;
async.series([
    function(next) {
        setTimeout(next, 2000);
    },
    function(next) {
        LoanTable.get({
            loanId: "1"
        }, function(err, _loanInstance) {
            if (err) {
                return next(err);
            }

            loanInstance = _loanInstance;
            return next();
        });
    },
    function(next) {
        // Example of augmented function
        loanInstance.set("foo", loanInstance.getFoo());
        loanInstance.update(next);
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
            LoanTable.scan(params, (err, data) => {
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
        // Example of augmented function
        loanInstance.delete(next);
    },
], (err) => {
    console.error(err);
});

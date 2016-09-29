// This is completely untested. Just a proposed API example

/* This is an example of using the Loan object by itself. We would probably only do this in the onboard route. */
var async = require("async");
var Loan = require("./Loan/Instance");
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
]);

/* This is an example of using the LoanTable object */
var LoanTable = require("./Loan/Table");
var loanInstance;
async.series([
    function(next) {
        LoanTable.get({
            loanId: "5"
        }, function(err, _loanInstance) {
            if (err) {
                return next(err);
            }
            _loanInstance = loanInstance;
        });
    },
    function(next) {
        loanInstance.set("foo", "bar");
        loanInstance.update(next);
    },
    function(next) {
        loanInstance.delete(next);
    },
], (err) => {
    if(err) {
        console.error(err);
    }
});
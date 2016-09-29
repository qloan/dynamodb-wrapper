// This is completely untested. Just a proposed API example

/* This is an example of using the Loan object by itself. We would probably only do this in the onboard route. */
var async = require("async");
var Loan = require("./Loan/Instance");
var instanceOfLoan = new Loan({
    loanId: "1",
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
], (err) => {
});

/* This is an example of using the LoanTable object */
var LoanTable = require("./Loan/Table");
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
        loanInstance.set("foo", "def");
        loanInstance.update(next);
    },
], (err) => {
    if(err) {
        console.error(err);
    }
});
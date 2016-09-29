var Table = require("../../lib/table");
var LoanTable = new Table({
    model: require("./TableDefinition"),
    itemConstructor: require("./Loan")
});
var AWS      = require("aws-sdk");
var JoiCrypt = require("./util/joicrypt")

module.exports = {
    item   : require("./item"),
    schema : require("./schema"),
    table  : require("./table"),
    joi    : new JoiCrypt().joi
};

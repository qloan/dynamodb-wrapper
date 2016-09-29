var Table = require("../../lib/table");

/* require this file if you need get, scan, or query */
module.exports = new Table({
    model: require("./Definition"),
    itemConstructor: require("./Instance")
});
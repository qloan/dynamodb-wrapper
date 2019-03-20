//TODO: Transfer tests from cl-models
const { promisify } = require("util");

const Table = require("./table");

class PromisifiedTable extends Table {
  async get(key) {
    return promisify(super.get.bind(this))(key);
  }

  async query(params) {
    return promisify(super.query.bind(this))(params);
  }
}

module.exports = PromisifiedTable;

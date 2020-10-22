const { promisify } = require("util");

const Table = require("./table");

class PromisifiedTable extends Table {
  async get(key, getParams = {}) {
    return promisify(super.get.bind(this))(key, getParams);
  }

  async query(params) {
    return promisify(super.query.bind(this))(params);
  }

  async scan(params) {
    return promisify(super.scan.bind(this))(params);
  }
}

module.exports = PromisifiedTable;

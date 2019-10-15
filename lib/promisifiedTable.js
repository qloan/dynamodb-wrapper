const { promisify } = require("util");

const Table = require("./table");

class PromisifiedTable extends Table {
  async get(key) {
    return promisify(super.get.bind(this))(key);
  }

  async query(params) {
    return promisify(super.query.bind(this))(params);
  }

  async scan(params) {
    return promisify(super.scan.bind(this))(params);
  }

  async delete(params){
    return promisify(super.delete.bind(this))(params);
  }
}

module.exports = PromisifiedTable;

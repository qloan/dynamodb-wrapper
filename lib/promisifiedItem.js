const { promisify } = require("util");

const Item = require("./item");

class PromisifiedItem extends Item {
  create() {
    return promisify(super.create.bind(this))();
  }

  async remove(field) {
    return super.remove.bind(this, field)();
  }

  /**
   * @return {Promise}
   */
  update() {
    return promisify(super.update.bind(this))();
  }
}

module.exports = PromisifiedItem;

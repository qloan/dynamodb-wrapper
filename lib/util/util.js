const util = {
  clone: obj => {
    if (typeof obj === "undefined") {
      return obj;
    }
    return JSON.parse(JSON.stringify(obj));
  }
};

module.exports = util;

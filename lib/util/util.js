const util = {
  clone: obj => {
    if (typeof obj === "undefined") {
      return obj;
    }
    return JSON.parse(JSON.stringify(obj));
  },
  forceArray: val => {
    return Array.isArray(val) ? val : [val];
  }
};

module.exports = util;

const _ = require("lodash");
const util = {
  clone: obj => {
    if (typeof obj === "undefined") {
      return obj;
    }
    return JSON.parse(JSON.stringify(obj));
  },
  forceArray: val => {
    return Array.isArray(val) ? val : [val];
  },
  extendedTimestamp: () => {
    return new Date().toISOString().split("\.")[0] + '.' + _.padStart(process.hrtime()[1], 9, '0') + "Z";
  }
};

module.exports = util;

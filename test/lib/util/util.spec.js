const util = require("lib/util/util");
const {assert, expect} = require("chai");
const joi = require('joi');

describe("Util::", function() {
    describe("Get Extended Timestamp", function() {
        it("Should consistently generate a timestamp that matches the iso date schema", function() {
            const schema = joi.string().isoDate().required();
            const time = util.extendedTimestamp();
            for (let i = 0; i < 50000; i++) {
                const validationResult = schema.validate(time);
                assert(!validationResult.error, "Time should match schema");
            }
        });
    });
});
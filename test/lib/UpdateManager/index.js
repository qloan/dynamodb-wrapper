var UpdateManager = require("../../../lib/UpdateManager");
var assert = require("chai").assert;
var expect = require("chai").expect;
var sinon = require("sinon");
describe("UpdateManager", function() {
    var updateManager;
    var json;
    beforeEach(function() {
        json = getMockJson();
        updateManager = new UpdateManager(json);
    });
    describe("Json", function() {
        describe("Set", function() {
            it("Level 1", function() {
                updateManager.set("a", "__NEW_VALUE");
                var newJson = updateManager.getJson();
                expect(newJson.a).to.equal("__NEW_VALUE");
            });
            it("Level 2", function() {
                updateManager.set("c.d", "__NEW_VALUE");
                var newJson = updateManager.getJson();
                expect(newJson.c.d).to.equal("__NEW_VALUE");
            });
            it("Non-existent level", function() {
                updateManager.set("c.a.a.b", "__NEW_VALUE");
                var newJson = updateManager.getJson();
                expect(newJson.c.a.a.b).to.equal("__NEW_VALUE");
            });
        });
    });
    describe("Dynamo", function() {
        describe("Set", function() {
            it("Level 1", function() {
                updateManager.set("a", "__NEW_VALUE");
            });
        });
        describe("Add", function() {
            it("Level 1", function() {
                updateManager.add("num", "6");
                console.dir(updateManager.getJson());
                console.dir(updateManager.getDynamoUpdateExpression());
            });
        });
    });
});

function getMockJson() {
    return {
        a: true,
        b: true,
        c: {
            d: true,
            e: true,
            f: {
                g: true,
                h: true
            }
        },
        num: 5
    };
}

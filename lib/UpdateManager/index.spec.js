var UpdateManager = require("./index");
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
        describe("Add", function() {
            it("Should add to a number", function() {
                json.c.d = 5;
                updateManager = new UpdateManager(json);
                updateManager.add("c.d", 6);
                var newJson = updateManager.getJson();
                expect(newJson.c.d).to.equal(11);
            });
            it("Should work with numeric strings", function() {
                json.c.d = 5;
                updateManager = new UpdateManager(json);
                updateManager.add("c.d", "6");
                var newJson = updateManager.getJson();
                expect(newJson.c.d).to.equal(11);
            });
            it("Add to NaN", function() {
                json.c.d = "a";
                updateManager = new UpdateManager(json);
                updateManager.add("c.d", "6");
                var newJson = updateManager.getJson();
                expect(newJson.c.d).to.equal("a6");
            });
            it("Add NaN", function() {
                json.c.d = "6";
                updateManager = new UpdateManager(json);
                updateManager.add("c.d", "a");
                var newJson = updateManager.getJson();
                expect(newJson.c.d).to.equal("6NaN");
            });
        });
        describe("Append", function() {
            it("Should append a value to an empty array", function() {
                json.c.d = [];
                updateManager = new UpdateManager(json);
                updateManager.append("c.d", 6);
                var newJson = updateManager.getJson();
                expect(newJson.c.d).to.deep.equal([6]);
            });
            it("Should append a value to a populated array", function() {
                json.c.d = [5, 6];
                updateManager = new UpdateManager(json);
                updateManager.append("c.d", 7);
                var newJson = updateManager.getJson();
                expect(newJson.c.d).to.deep.equal([5,6,7]);
            });
            it("Should append two empty arrays", function() {
                json.c.d = [5];
                updateManager = new UpdateManager(json);
                updateManager.append("c.d", [5]);
                var newJson = updateManager.getJson();
                expect(newJson.c.d).to.deep.equal([5,5]);
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

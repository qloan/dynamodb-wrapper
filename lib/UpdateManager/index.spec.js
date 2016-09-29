var UpdateManager = require("./index");
var assert = require("chai").assert;
var expect = require("chai").expect;
var sinon = require("sinon");
describe("UpdateManager", function() {
    var updateManager;
    var json;
    var sandbox;
    var constructJsonCommandSpy;
    beforeEach(function() {
        json = getMockJson();
        updateManager = new UpdateManager(json);
    });
    beforeEach(function() {
        sandbox = sinon.sandbox.create();
        constructJsonCommandSpy = sandbox.spy(updateManager.jsonUpdateExpression, "constructCommand");
    });
    afterEach(function() {
        sandbox.restore();
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
                updateManager.updateJson(json);
                updateManager.add("c.d", 6);
                var newJson = updateManager.getJson();
                expect(newJson.c.d).to.equal(11);
            });
            it("Should work with numeric strings", function() {
                json.c.d = 5;
                updateManager.updateJson(json);
                updateManager.add("c.d", "6");
                var newJson = updateManager.getJson();
                expect(newJson.c.d).to.equal(11);
            });
            it("Add to NaN", function() {
                json.c.d = "a";
                updateManager.updateJson(json);
                updateManager.add("c.d", "6");
                var newJson = updateManager.getJson();
                assert(!constructJsonCommandSpy.called);
                expect(newJson.c.d).to.equal("a");
            });
            it("Add NaN", function() {
                json.c.d = "6";
                updateManager.updateJson(json);
                updateManager.add("c.d", "a");
                var newJson = updateManager.getJson();
                assert(!constructJsonCommandSpy.called);
                expect(newJson.c.d).to.equal("6");
            });
        });
        describe("Append", function() {
            it("Should append a value to an empty array", function() {
                json.c.d = [];
                updateManager.updateJson(json);
                updateManager.append("c.d", 6);
                var newJson = updateManager.getJson();
                expect(newJson.c.d).to.deep.equal([6]);
            });
            it("Should append a value to a populated array", function() {
                json.c.d = [5, 6];
                updateManager.updateJson(json);
                updateManager.append("c.d", 7);
                var newJson = updateManager.getJson();
                expect(newJson.c.d).to.deep.equal([5,6,7]);
            });
            it("Should append two empty arrays", function() {
                json.c.d = [];
                updateManager.updateJson(json);
                updateManager.append("c.d", []);
                var newJson = updateManager.getJson();
                expect(newJson.c.d).to.deep.equal([]);
            });
            it("Should append two populated arrays", function() {
                json.c.d = [1,2];
                updateManager.updateJson(json);
                updateManager.append("c.d", [5,6]);
                var newJson = updateManager.getJson();
                expect(newJson.c.d).to.deep.equal([1,2,5,6]);
            });
            it("Appending to a non-list", function() {
                json.c.d = "R";
                updateManager.updateJson(json);
                updateManager.append("c.d", [5,6]);
                var newJson = updateManager.getJson();
                assert(!constructJsonCommandSpy.called);
                expect(newJson.c.d).to.deep.equal("R");
            });
        });
        describe("Remove", function() {
            it("Level 0", function() {
                updateManager.updateJson(json);
                updateManager.remove("c.d");
                var newJson = updateManager.getJson();
                assert(!newJson.c.hasOwnProperty("d"));
            });
            it("Level 1", function() {
                updateManager.updateJson(json);
                updateManager.remove("c");
                var newJson = updateManager.getJson();
                assert(!newJson.hasOwnProperty("c"));
            });
            it("Non-existent Level", function() {
                updateManager.updateJson(json);
                updateManager.remove("c.r.d.e");
                var newJson = updateManager.getJson();
                expect(newJson).to.deep.equal(json);
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

var UpdateManager = require("./index");
var assert = require("chai").assert;
var expect = require("chai").expect;
var sinon = require("sinon");
var token = "[:A-Z0-9_]+";
var __FIELD_NOT_FOUND = "__FIELD_NOT_FOUND";
var __UNIQUE_FIELD = "__UNIQUE_FIELD";
describe("UpdateManager", function() {
    var updateManager;
    var json;
    var sandbox;
    var constructJsonCommandSpy;
    var logErrorStub;
    beforeEach(function() {
        json = getMockJson();
        updateManager = new UpdateManager(json);
    });
    beforeEach(function() {
        sandbox = sinon.sandbox.create();
        constructJsonCommandSpy = sandbox.spy(updateManager.jsonUpdateExpression, "constructCommand");
        logErrorStub = sandbox.stub(updateManager.dependencies, "logError");
    });
    afterEach(function() {
        sandbox.restore();
    });
    describe("Json", function() {
        describe("Combination", function() {
            it("Should apply operations in order", function() {
                updateManager.set("a", "__NEW_VALUE_1");
                updateManager.set("a", "__NEW_VALUE_2");
                expect(updateManager.get("a")).to.equal("__NEW_VALUE_2");
            });
            it("Should work with add/set", function() {
                updateManager.set("a", "1");
                updateManager.set("a", "2");
                updateManager.add("a", "3");
                expect(updateManager.get("a")).to.equal(5);
            });
            it("Should work with set/add/remove/add", function() {
                updateManager.set("a", "1");
                updateManager.add("a", "2");
                updateManager.remove("a");
                updateManager.add("a", "3");
                expect(updateManager.get("a")).to.equal(3);
            });
            it("Should work with remove/add", function() {
                updateManager.remove("a");
                updateManager.add("a", "3");
                expect(updateManager.get("a")).to.equal(3);
            });
            it("Should work with remove/append", function() {
                updateManager.remove("a");
                updateManager.append("a", 3);
                expect(updateManager.get("a")).to.deep.equal([3]);
            });
            it("Should work with multiple gets and multiple sets", function() {
                updateManager.set("a", 1);
                expect(updateManager.get("a")).to.equal(1);
                updateManager.set("a", 2);
                expect(updateManager.get("a")).to.equal(2);
                updateManager.set("a", 3);
                expect(updateManager.get("a")).to.equal(3);
            });
            it("Should clone", function() {
                var json = updateManager.get();
                json.c.f.h = "SOMETHING";
                expect(updateManager.get("c.f.h")).to.equal(true);
            });
        });
        describe("Get", function() {
            it("Should be able to get entire json file", function() {
                expect(updateManager.get()).to.deep.equal(json);
            });
            it("Should be able to get single field", function() {
                expect(updateManager.get("unique_field")).to.deep.equal(__UNIQUE_FIELD);
            });
        });
        describe("Set", function() {
            it("Level 1", function() {
                updateManager.set("a", "__NEW_VALUE");
                expect(updateManager.get("a")).to.equal("__NEW_VALUE");
            });
            it("Level 2", function() {
                updateManager.set("c.d", "__NEW_VALUE");
                expect(updateManager.get("c.d")).to.equal("__NEW_VALUE");
            });
            it("Non-existent level", function() {
                updateManager.set("c.a.a.b", "__NEW_VALUE");
                expect(updateManager.get("c.a.a.b")).to.equal("__NEW_VALUE");
            });
        });
        describe("Add", function() {
            it("Should add to a number", function() {
                json.c.d = 5;
                updateManager._updateJson(json);
                updateManager.add("c.d", 6);
                expect(updateManager.get("c.d")).to.equal(11);
            });
            it("Should work with single numeric string", function() {
                json.c.d = 5;
                updateManager._updateJson(json);
                updateManager.add("c.d", "6");
                expect(updateManager.get("c.d")).to.equal(11);
            });
            it("Should work with two numeric strings", function() {
                json.c.d = "5";
                updateManager._updateJson(json);
                updateManager.add("c.d", "6");
                expect(updateManager.get("c.d")).to.equal(11);
            });
            it("Add to NaN", function() {
                json.c.d = "a";
                updateManager._updateJson(json);
                updateManager.add("c.d", "6");
                expect(updateManager.get("c.d")).to.equal("a");
                assert(!constructJsonCommandSpy.called);
            });
            it("Add NaN", function() {
                json.c.d = "6";
                updateManager._updateJson(json);
                updateManager.add("c.d", "a");
                expect(updateManager.get("c.d")).to.equal("6");
                assert(!constructJsonCommandSpy.called);
            });
            it("Add to undefined", function() {
                updateManager.add("z.z.z.z", 5);
                expect(updateManager.get("z.z.z.z", __FIELD_NOT_FOUND)).to.equal(5);
            });
        });
        describe("Append", function() {
            it("Should append a value to an empty array", function() {
                json.c.d = [];
                updateManager._updateJson(json);
                updateManager.append("c.d", 6);
                expect(updateManager.get("c.d")).to.deep.equal([6]);
            });
            it("Should append a value to a populated array", function() {
                json.c.d = [5, 6];
                updateManager._updateJson(json);
                updateManager.append("c.d", 7);
                expect(updateManager.get("c.d")).to.deep.equal([5,6,7]);
            });
            it("Should append two empty arrays", function() {
                json.c.d = [];
                updateManager._updateJson(json);
                updateManager.append("c.d", []);
                expect(updateManager.get("c.d")).to.deep.equal([]);
            });
            it("Should append two populated arrays", function() {
                json.c.d = [1,2];
                updateManager._updateJson(json);
                updateManager.append("c.d", [5,6]);
                expect(updateManager.get("c.d")).to.deep.equal([1,2,5,6]);
            });
            it("Appending to a non-list", function() {
                json.c.d = "R";
                updateManager._updateJson(json);
                updateManager.append("c.d", [5,6]);
                expect(updateManager.get("c.d")).to.equal("R");
                assert(!constructJsonCommandSpy.called);
            });
            it("Appending to a undefined", function() {
                updateManager.append("z.z.z", [5,6]);
                expect(updateManager.get("z.z.z")).to.deep.equal([5,6]);
            });
        });
        describe("Remove", function() {
            it("Level 0", function() {
                updateManager.remove("c.d");
                var newJson = updateManager.get();
                assert(!newJson.c.hasOwnProperty("d"));
            });
            it("Level 1", function() {
                updateManager.remove("c");
                var newJson = updateManager.get();
                assert(!newJson.hasOwnProperty("c"));
            });
            it("Non-existent Level", function() {
                updateManager.remove("c.r.d.e");
                var newJson = updateManager.get();
                expect(newJson).to.deep.equal(json);
            });
        });
    });
    describe("Dynamo", function() {
        describe("Combination", function() {
            it("Should apply operations in order", function() {
                updateManager.set("a", "__NEW_VALUE_1");
                updateManager.set("a", "__NEW_VALUE_2");
                var updateExpression = updateManager.getDynamoUpdateExpression();
                expect(updateExpression.UpdateExpression).to.match(new RegExp(`SET a = ${token},a = ${token}`));
                expect(updateExpression.ExpressionAttributeValues).to.deep.equal({
                    ":TOKEN_1": "__NEW_VALUE_1",
                    ":TOKEN_2": "__NEW_VALUE_2"
                });
            });
            it("Should work with add/set", function() {
                updateManager.set("a", "5");
                updateManager.add("a", "2");
                var updateExpression = updateManager.getDynamoUpdateExpression();
                expect(updateExpression.UpdateExpression).to.match(new RegExp(`.*SET a = ${token},a = a [\+] ${token}`));
                expect(updateExpression.ExpressionAttributeValues).to.deep.equal({
                    ":TOKEN_1": "5",
                    ":TOKEN_2": "2"
                });
            });
            it("Should work with set/add/remove/add", function() {
                updateManager.set("a", "1");
                updateManager.add("a", "2");
                updateManager.remove("a");
                updateManager.add("a", "3");
                var updateExpression = updateManager.getDynamoUpdateExpression();
                expect(updateExpression.UpdateExpression).to.match(new RegExp(`SET a = ${token},a = a [\+] ${token},a = a [\+] ${token} REMOVE a`));
                expect(updateExpression.ExpressionAttributeValues).to.deep.equal({
                    ":TOKEN_1": "1",
                    ":TOKEN_2": "2",
                    ":TOKEN_3": "3"
                });
            });
            it("Should work with remove/add", function() {
                updateManager.remove("a");
                updateManager.add("a", "3");
                var updateExpression = updateManager.getDynamoUpdateExpression();
                expect(updateExpression.UpdateExpression).to.match(new RegExp(`SET a = a [\+] ${token} REMOVE a`));
                expect(updateExpression.ExpressionAttributeValues).to.deep.equal({
                    ":TOKEN_1": "3"
                });
            });
            it("Should work with remove/append", function() {
                updateManager.remove("a");
                updateManager.append("a", 3);
                var updateExpression = updateManager.getDynamoUpdateExpression();
                expect(updateExpression.UpdateExpression).to.match(new RegExp(`SET a = list_append[\(]a , ${token}[\)] REMOVE a`));
                expect(updateExpression.ExpressionAttributeValues).to.deep.equal({
                    ":TOKEN_1": 3
                });
            });
            it("Empty Expression", function() {
                var updateExpression = updateManager.getDynamoUpdateExpression();
                expect(updateExpression.UpdateExpression).to.equal("");
                expect(updateExpression.ExpressionAttributeValues).to.deep.equal({});
            });
        });
        describe("Set", function() {
            it("Level 1", function() {
                updateManager.set("a", "__NEW_VALUE");
                var updateExpression = updateManager.getDynamoUpdateExpression();
                expect(updateExpression.UpdateExpression).to.match(new RegExp(`SET a = ${token}`));
                expect(updateExpression.ExpressionAttributeValues).to.deep.equal({
                    ":TOKEN_1": "__NEW_VALUE"
                });
            });
        });
        describe("Add", function() {
            it("Should add to a number", function() {
                json.c.d = 5;
                updateManager._updateJson(json);
                updateManager.add("d.g.h.e.d", 6);
                var updateExpression = updateManager.getDynamoUpdateExpression();
                expect(updateExpression.UpdateExpression).to.match(new RegExp(`SET d\.g\.h\.e\.d = d\.g\.h\.e\.d [\+] ${token}`));
                expect(updateExpression.ExpressionAttributeValues).to.deep.equal({
                    ":TOKEN_1": 6
                });
            });
        });
        describe("Append", function() {
            it("Should append a value to an empty array", function() {
                json.c.d = [];
                updateManager._updateJson(json);
                updateManager.append("c.d", 6);
                var updateExpression = updateManager.getDynamoUpdateExpression();
                expect(updateExpression.UpdateExpression).to.match(new RegExp(`SET c\.d = list_append[\(]c\.d , ${token}[\)]`));
                expect(updateExpression.ExpressionAttributeValues).to.deep.equal({
                    ":TOKEN_1": 6
                });
            });
        });
        describe("Remove", function() {
            it("Level 0", function() {
                updateManager.remove("c.d");
                var updateExpression = updateManager.getDynamoUpdateExpression();
                expect(updateExpression.UpdateExpression).to.match(new RegExp(`REMOVE c\.d`));
                expect(updateExpression.ExpressionAttributeValues).to.deep.equal({});
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
        num: 5,
        unique_field: __UNIQUE_FIELD
    };
}

function expressionMatches(expressionA, expressionB) {
    var commandsA = expressionA.split(",");
    var commandsB = expressionB.split(",");
    expect(commandsA.length).to.equal(commandsB.length);
    for (var i = 0; i < commandsA.length; i++) {
        assert(commandEqual(commandsA[i], commandsB[i]));
    }
    return true;
}

function commandEqual(commandA, commandB) {
    var tokensA = commandA.split(" ");
    var tokensB = commandB.split(" ");
    expect(tokensA.length).to.equal(tokensB.length);
    for (var i = 0; i < tokensA.length; i++) {
        var tokenA = tokensA[i];
        var tokenB = tokensB[i];
        assert(tokenA === "*" || tokenB === "*" || tokenA === tokenB);
    }
    return true;
}

function getToken(expression, commandIndex, tokenIndex) {
    var commands = expression.split(",");
    var command = commands[commandIndex];
    var tokens = command.split(" ");
    return tokens[tokenIndex];
}

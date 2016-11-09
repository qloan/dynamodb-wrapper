var UpdateManager = require("lib/updateManager");
var assert = require("chai").assert;
var expect = require("chai").expect;
var sinon = require("sinon");
var token = "[:#A-Z0-9_]+";
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
    describe("Safe character names", function() {
        describe("Ordering", function() {
            it("First", function() {
                updateManager.set("0.a.a", "__NEW_VALUE");
                var updateExpression = updateManager.getDynamoUpdateExpression();
                expect(updateExpression.UpdateExpression).to.match(new RegExp(`SET ${token}.a.a = ${token}`));
                expect(updateExpression.ExpressionAttributeValues).to.deep.equal({
                    ":TOKEN_1": {
                        "action": "SET",
                        "field"  : "0.a.a",
                        "value"  : "__NEW_VALUE"
                    }
                });
                expect(updateExpression.ExpressionAttributeNames).to.deep.equal({
                    "#TOKEN_2": "0"
                });
            });
            it("Middle", function() {
                updateManager.set("a.0.a", "__NEW_VALUE");
                var updateExpression = updateManager.getDynamoUpdateExpression();
                expect(updateExpression.UpdateExpression).to.match(new RegExp(`SET a.${token}.a = ${token}`));
                expect(updateExpression.ExpressionAttributeValues).to.deep.equal({
                    ":TOKEN_1": {
                        "action": "SET",
                        "field"  : "a.0.a",
                        "value"  : "__NEW_VALUE"
                    }
                });
                expect(updateExpression.ExpressionAttributeNames).to.deep.equal({
                    "#TOKEN_2": "0"
                });
            });
            it("Last", function() {
                updateManager.set("a.a.0", "__NEW_VALUE");
                var updateExpression = updateManager.getDynamoUpdateExpression();
                expect(updateExpression.UpdateExpression).to.match(new RegExp(`SET a.a.${token} = ${token}`));
                expect(updateExpression.ExpressionAttributeValues).to.deep.equal({
                    ":TOKEN_1": {
                        "action": "SET",
                        "field"  : "a.a.0",
                        "value"  : "__NEW_VALUE"
                    }
                });
                expect(updateExpression.ExpressionAttributeNames).to.deep.equal({
                    "#TOKEN_2": "0"
                });
            });
        });
        describe("Character set", function() {
            describe("Numeric", function() {
                it("Whole, positive", function() {
                    updateManager.set("a.1.a", "__NEW_VALUE");
                    var updateExpression = updateManager.getDynamoUpdateExpression();
                    expect(updateExpression.UpdateExpression).to.match(new RegExp(`SET a.${token}.a = ${token}`));
                    expect(updateExpression.ExpressionAttributeValues).to.deep.equal({
                        ":TOKEN_1": {
                            "action": "SET",
                            "field"  : "a.1.a",
                            "value"  : "__NEW_VALUE"
                        }
                    });
                    expect(updateExpression.ExpressionAttributeNames).to.deep.equal({
                        "#TOKEN_2": "1"
                    });
                });
                it("Negative", function() {
                    updateManager.set("a.-1.a", "__NEW_VALUE");
                    var updateExpression = updateManager.getDynamoUpdateExpression();
                    expect(updateExpression.UpdateExpression).to.match(new RegExp(`SET a.${token}.a = ${token}`));
                    expect(updateExpression.ExpressionAttributeValues).to.deep.equal({
                        ":TOKEN_1": {
                            "action": "SET",
                            "field"  : "a.-1.a",
                            "value"  : "__NEW_VALUE"
                        }
                    });
                    expect(updateExpression.ExpressionAttributeNames).to.deep.equal({
                        "#TOKEN_2": "-1"
                    });
                });
                it("Numeric, second", function() {
                    updateManager.set("a.a1.a", "__NEW_VALUE");
                    var updateExpression = updateManager.getDynamoUpdateExpression();
                    expect(updateExpression.UpdateExpression).to.match(new RegExp(`SET a.a1.a = ${token}`));
                    expect(updateExpression.ExpressionAttributeValues).to.deep.equal({
                        ":TOKEN_1": {
                            "action": "SET",
                            "field"  : "a.a1.a",
                            "value"  : "__NEW_VALUE"
                        }
                    });
                    assert(!updateExpression.hasOwnProperty("ExpressionAttributeNames"));
                });
            });
        });
        it("Dash", function() {
            updateManager.set("a.-.a", "__NEW_VALUE");
            var updateExpression = updateManager.getDynamoUpdateExpression();
            expect(updateExpression.UpdateExpression).to.match(new RegExp(`SET a.${token}.a = ${token}`));
            expect(updateExpression.ExpressionAttributeValues).to.deep.equal({
                ":TOKEN_1": {
                    "action": "SET",
                    "field"  : "a.-.a",
                    "value"  : "__NEW_VALUE"
                }
            });
            expect(updateExpression.ExpressionAttributeNames).to.deep.equal({
                "#TOKEN_2": "-"
            });
        });
        it("Dot", function() {
            updateManager.set(["a",".","a"], "__NEW_VALUE");
            var updateExpression = updateManager.getDynamoUpdateExpression();
            expect(updateExpression.UpdateExpression).to.match(new RegExp(`SET a.${token}.a = ${token}`));
            expect(updateExpression.ExpressionAttributeValues).to.deep.equal({
                ":TOKEN_1": {
                    "action": "SET",
                    "field"  : ["a",".","a"],
                    "value"  : "__NEW_VALUE"
                }
            });
            expect(updateExpression.ExpressionAttributeNames).to.deep.equal({
                "#TOKEN_2": "."
            });
        });
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
            it("Should work with multiple nested sets", function() {
                var bObj = {b: true};
                updateManager.set("a", bObj);
                expect(updateManager.get("a.b")).to.equal(true);
                bObj.b = false;
                expect(updateManager.get("a.b")).to.equal(true);
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
            it("Should be able to get single field", function() {
                expect(updateManager.get("z.z.z.z", __FIELD_NOT_FOUND)).to.equal(__FIELD_NOT_FOUND);
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
                assert(logErrorStub.called);
            });
            it("Add NaN", function() {
                json.c.d = "6";
                updateManager._updateJson(json);
                updateManager.add("c.d", "a");
                expect(updateManager.get("c.d")).to.equal("6");
                assert(!constructJsonCommandSpy.called);
                assert(logErrorStub.called);
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
                assert(logErrorStub.called);
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
                    ":TOKEN_1": {
                        "action": "SET",
                        "field"  : "a",
                        "value"  : "__NEW_VALUE_1"
                    },
                    ":TOKEN_2": {
                        "action": "SET",
                        "field" : "a",
                        "value" : "__NEW_VALUE_2"
                    }
                });
            });
            it("Should work with add/set", function() {
                updateManager.set("a", "5");
                updateManager.add("a", "2");
                var updateExpression = updateManager.getDynamoUpdateExpression();
                expect(updateExpression.UpdateExpression).to.match(new RegExp(`.*SET a = ${token},a = if_not_exists [\(] a , ${token} [\)] [\+] ${token}`));
                expect(updateExpression.ExpressionAttributeValues).to.deep.equal({
                    ":TOKEN_1": {
                        "action": "SET",
                        "field"  : "a",
                        "value"  : "5"
                    },
                    ":TOKEN_2": {
                        "value" : 0
                    },
                    ":TOKEN_3": {
                        "action" : "ADD",
                        "field"  : "a",
                        "value"  : "2"
                    }
                });
            });
            it("Should work with set/add/remove/add", function() {
                updateManager.set("a", "1");
                updateManager.add("a", "2");
                updateManager.remove("a");
                updateManager.add("a", "3");
                var updateExpression = updateManager.getDynamoUpdateExpression();
                expect(updateExpression.UpdateExpression).to.match(new RegExp(`SET a = ${token},a = if_not_exists [\(] a , ${token} [\)] [\+] ${token},a = if_not_exists [\(] a , ${token} [\)] [\+] ${token} REMOVE a`));
                expect(updateExpression.ExpressionAttributeValues).to.deep.equal({
                    ":TOKEN_1": {
                        "action": "SET",
                        "field"  : "a",
                        "value"  : "1"
                    },
                    ":TOKEN_2": {
                        "value" : 0
                    },
                    ":TOKEN_3": {
                        "action": "ADD",
                        "field"  : "a",
                        "value"  : "2"
                    },
                    ":TOKEN_4": {
                        "value" : 0
                    },
                    ":TOKEN_5": {
                        "action": "ADD",
                        "field"  : "a",
                        "value"  : "3"
                    }
                });
            });
            it("Should work with remove/add", function() {
                updateManager.remove("a");
                updateManager.add("a", "3");
                var updateExpression = updateManager.getDynamoUpdateExpression();
                expect(updateExpression.UpdateExpression).to.match(new RegExp(`SET a = if_not_exists [\(] a , ${token} [\)] [\+] ${token} REMOVE a`));
                expect(updateExpression.ExpressionAttributeValues).to.deep.equal({
                    ":TOKEN_1": {
                        "value": 0
                    },
                    ":TOKEN_2": {
                        "action": "ADD",
                        "field"  : "a",
                        "value"  : "3"
                    }
                });
            });
            it("Should work with remove/append", function() {
                updateManager.remove("a");
                updateManager.append("a", 3);
                var updateExpression = updateManager.getDynamoUpdateExpression();
                expect(updateExpression.UpdateExpression).to.match(new RegExp(`SET a = list_append [\(] if_not_exists [\(] a , ${token} [\)] , ${token}[\)] REMOVE a`));
                expect(updateExpression.ExpressionAttributeValues).to.deep.equal({
                    ":TOKEN_1": {
                        "value": []
                    },
                    ":TOKEN_2": {
                        "action": "APPEND",
                        "field"  : "a",
                        "value"  : [3]
                    }
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
                    ":TOKEN_1": {
                        "action": "SET",
                        "field"  : "a",
                        "value"  : "__NEW_VALUE"
                    }
                });
            });
            it("Should escape unsafe field names", function() {
                updateManager.set("0", "__NEW_VALUE");
                var updateExpression = updateManager.getDynamoUpdateExpression();
                expect(updateExpression.UpdateExpression).to.match(new RegExp(`SET ${token} = ${token}`));
                expect(updateExpression.ExpressionAttributeValues).to.deep.equal({
                    ":TOKEN_1": {
                        "action": "SET",
                        "field"  : "0",
                        "value"  : "__NEW_VALUE"
                    }
                });
                expect(updateExpression.ExpressionAttributeNames).to.deep.equal({
                    "#TOKEN_2": "0"
                });
            });
        });
        describe("Add", function() {
            it("Should add to a number", function() {
                json.c.d = 5;
                updateManager._updateJson(json);
                updateManager.add("d.g.h.e.d", 6);
                var updateExpression = updateManager.getDynamoUpdateExpression();
                expect(updateExpression.UpdateExpression).to.match(new RegExp(`SET d\.g\.h\.e\.d = if_not_exists [\(] d\.g\.h\.e\.d , ${token} [\)] [\+] ${token}`));
                expect(updateExpression.ExpressionAttributeValues).to.deep.equal({
                    ":TOKEN_1": {
                        "value": 0
                    },
                    ":TOKEN_2": {
                        "action": "ADD",
                        "field"  : "d.g.h.e.d",
                        "value"  : 6
                    }
                });
            });
            it("Should escape unsafe field names", function() {
                json.c.d = 5;
                updateManager._updateJson(json);
                updateManager.add("d.0.h.e.d", 6);
                var updateExpression = updateManager.getDynamoUpdateExpression();
                expect(updateExpression.UpdateExpression).to.match(new RegExp(`SET d\.${token}\.h\.e\.d = if_not_exists [\(] d\.${token}\.h\.e\.d , ${token} [\)] [\+] ${token}`));
                expect(updateExpression.ExpressionAttributeValues).to.deep.equal({
                    ":TOKEN_1": {
                        "value": 0
                    },
                    ":TOKEN_2": {
                        "action": "ADD",
                        "field"  : "d.0.h.e.d",
                        "value"  : 6
                    }
                });
                expect(updateExpression.ExpressionAttributeNames).to.deep.equal({
                    "#TOKEN_3": "0"
                });
            });
        });
        describe("Append", function() {
            it("Should append a value to an empty array", function() {
                json.c.d = [];
                updateManager._updateJson(json);
                updateManager.append("c.d", 6);
                var updateExpression = updateManager.getDynamoUpdateExpression();
                expect(updateExpression.UpdateExpression).to.match(new RegExp(`SET c\.d = list_append [\(] if_not_exists [\(] c\.d , ${token} [\)] , ${token}[\)]`));
                expect(updateExpression.ExpressionAttributeValues).to.deep.equal({
                    ":TOKEN_1": {
                        "value": []
                    },
                    ":TOKEN_2": {
                        "action": "APPEND",
                        "field"  : "c.d",
                        "value"  : [6]
                    }
                });
            });
            it("Should escape unsafe character names", function() {
                json.c.d = [];
                updateManager._updateJson(json);
                updateManager.append("c.0", 6);
                var updateExpression = updateManager.getDynamoUpdateExpression();
                expect(updateExpression.UpdateExpression).to.match(new RegExp(`SET c\.${token} = list_append [\(] if_not_exists [\(] c\.${token} , ${token} [\)] , ${token}[\)]`));
                expect(updateExpression.ExpressionAttributeValues).to.deep.equal({
                    ":TOKEN_1": {
                        "value": []
                    },
                    ":TOKEN_2": {
                        "action": "APPEND",
                        "field"  : "c.0",
                        "value"  : [6]
                    }
                });
                expect(updateExpression.ExpressionAttributeNames).to.deep.equal({
                    "#TOKEN_3": "0"
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
            it("Should escape unsafe character names", function() {
                updateManager.remove("c.0");
                var updateExpression = updateManager.getDynamoUpdateExpression();
                expect(updateExpression.UpdateExpression).to.match(new RegExp(`REMOVE c\.${token}`));
                expect(updateExpression.ExpressionAttributeValues).to.deep.equal({});
                expect(updateExpression.ExpressionAttributeNames).to.deep.equal({
                    "#TOKEN_1": "0"
                });
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

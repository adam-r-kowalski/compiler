import { expect, test } from "vitest";
import { tokenize } from "../src/tokenizer";
import { parseExpression } from "../src/parser";

test("parse symbol", () => {
    const tokens = tokenize("foo");
    const actual = parseExpression(tokens);
    const expected = [{ kind: "symbol", value: "foo" }, []];
    expect(actual).toEqual(expected);
});

test("parse int", () => {
    const tokens = tokenize("42");
    const actual = parseExpression(tokens);
    const expected = [{ kind: "int", value: "42" }, []];
    expect(actual).toEqual(expected);
});

test("parse float", () => {
    const tokens = tokenize("3.14");
    const actual = parseExpression(tokens);
    const expected = [{ kind: "float", value: "3.14" }, []];
    expect(actual).toEqual(expected);
});

test("parse string", () => {
    const tokens = tokenize('"Hello World"');
    const actual = parseExpression(tokens);
    const expected = [{ kind: "string", value: "Hello World" }, []];
    expect(actual).toEqual(expected);
});

test("parse function call with no arguments", () => {
    const tokens = tokenize('f()');
    const actual = parseExpression(tokens);
    const expected = [{
        kind: "call",
        value: {
            function: { kind: "symbol", value: "f" },
            arguments: []
        }
    }, []];
    expect(actual).toEqual(expected);
});

test("parse function call with one argument", () => {
    const tokens = tokenize('f(x)');
    const actual = parseExpression(tokens);
    const expected = [{
        kind: "call",
        value: {
            function: { kind: "symbol", value: "f" },
            arguments: [
                { kind: "symbol", value: "x" }
            ]
        }
    }, []];
    expect(actual).toEqual(expected);
});

test("parse function call with multiple arguments", () => {
    const tokens = tokenize('f(x, y, z)');
    const actual = parseExpression(tokens);
    const expected = [{
        kind: "call",
        value: {
            function: { kind: "symbol", value: "f" },
            arguments: [
                { kind: "symbol", value: "x" },
                { kind: "symbol", value: "y" },
                { kind: "symbol", value: "z" },
            ]
        }
    }, []];
    expect(actual).toEqual(expected);
});
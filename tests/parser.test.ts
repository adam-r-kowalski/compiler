import { expect, test } from "vitest";
import { tokenize } from "../src/tokenizer";
import { parseExpression } from "../src/parser";
import * as precedenceOf from "../src/precedenceOf";

test("parse symbol", () => {
    const tokens = tokenize("foo");
    const actual = parseExpression(tokens, precedenceOf.lowestPrecedence);
    const expected = [{ kind: "symbol", value: "foo" }, []];
    expect(actual).toEqual(expected);
});

test("parse int", () => {
    const tokens = tokenize("42");
    const actual = parseExpression(tokens, precedenceOf.lowestPrecedence);
    const expected = [{ kind: "int", value: "42" }, []];
    expect(actual).toEqual(expected);
});

test("parse float", () => {
    const tokens = tokenize("3.14");
    const actual = parseExpression(tokens, precedenceOf.lowestPrecedence);
    const expected = [{ kind: "float", value: "3.14" }, []];
    expect(actual).toEqual(expected);
});

test("parse string", () => {
    const tokens = tokenize('"Hello World"');
    const actual = parseExpression(tokens, precedenceOf.lowestPrecedence);
    const expected = [{ kind: "string", value: "Hello World" }, []];
    expect(actual).toEqual(expected);
});

test("parse function call with no arguments", () => {
    const tokens = tokenize('f()');
    const actual = parseExpression(tokens, precedenceOf.lowestPrecedence);
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
    const actual = parseExpression(tokens, precedenceOf.lowestPrecedence);
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
    const actual = parseExpression(tokens, precedenceOf.lowestPrecedence);
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

test("parse nested function call", () => {
    const tokens = tokenize('f(g(x))');
    const actual = parseExpression(tokens, precedenceOf.lowestPrecedence);
    const expected = [{
        kind: "call",
        value: {
            function: { kind: "symbol", value: "f" },
            arguments: [
                {
                    kind: "call",
                    value: {
                        function: { kind: "symbol", value: "g" },
                        arguments: [{ kind: "symbol", value: "x" }]
                    }
                },
            ]
        }
    }, []];
    expect(actual).toEqual(expected);
});

test("parse function definition with no parameters", () => {
    const tokens = tokenize('fn() -> i32 { 42 }');
    const actual = parseExpression(tokens, precedenceOf.lowestPrecedence);
    const expected = [{
        kind: "function",
        value: {
            parameters: [],
            returnType: { kind: "symbol", value: "i32" },
            body: { kind: "int", value: "42" }
        }
    }, []];
    expect(actual).toEqual(expected);
});

test("parse function definition with one parameter", () => {
    const tokens = tokenize('fn(x: i64) -> i64 { x }');
    const actual = parseExpression(tokens, precedenceOf.lowestPrecedence);
    const expected = [{
        kind: "function",
        value: {
            parameters: [
                {
                    name: "x",
                    type: { kind: "symbol", value: "i64" }
                }
            ],
            returnType: { kind: "symbol", value: "i64" },
            body: { kind: "symbol", value: "x" }
        }
    }, []];
    expect(actual).toEqual(expected);
});

test("parse function definition with two parameters", () => {
    const tokens = tokenize('fn(x: i64, y: bool) -> f64 { f(x, y) }');
    const actual = parseExpression(tokens, precedenceOf.lowestPrecedence);
    const expected = [{
        kind: "function",
        value: {
            parameters: [
                {
                    name: "x",
                    type: { kind: "symbol", value: "i64" }
                },
                {
                    name: "y",
                    type: { kind: "symbol", value: "bool" }
                }
            ],
            returnType: { kind: "symbol", value: "f64" },
            body: {
                kind: "call",
                value: {
                    function: { kind: "symbol", value: "f" },
                    arguments: [
                        { kind: "symbol", value: "x" },
                        { kind: "symbol", value: "y" }
                    ]
                }
            }
        }
    }, []];
    expect(actual).toEqual(expected);
});

test("parse function definition across multiple lines", () => {
    const tokens = tokenize(`
        fn(x: i64, y: bool) -> f64 {
            f(x, y)
        }
    `.trim());
    const actual = parseExpression(tokens, precedenceOf.lowestPrecedence);
    const expected = [{
        kind: "function",
        value: {
            parameters: [
                {
                    name: "x",
                    type: { kind: "symbol", value: "i64" }
                },
                {
                    name: "y",
                    type: { kind: "symbol", value: "bool" }
                }
            ],
            returnType: { kind: "symbol", value: "f64" },
            body: {
                kind: "call",
                value: {
                    function: { kind: "symbol", value: "f" },
                    arguments: [
                        { kind: "symbol", value: "x" },
                        { kind: "symbol", value: "y" }
                    ]
                }
            }
        }
    }, []];
    expect(actual).toEqual(expected);
});

test("parse variable define", () => {
    const tokens = tokenize('x = 42');
    const actual = parseExpression(tokens, precedenceOf.lowestPrecedence);
    const expected = [{
        kind: "define",
        value: {
            name: "x",
            value: { kind: "int", value: "42" }
        }
    }, []];
    expect(actual).toEqual(expected);
});

test("parse variable define with type annotation", () => {
    const tokens = tokenize('x: i32 = 42');
    const actual = parseExpression(tokens, precedenceOf.lowestPrecedence);
    const expected = [{
        kind: "define",
        value: {
            name: "x",
            type: { kind: "symbol", value: "i32" },
            value: { kind: "int", value: "42" }
        }
    }, []];
    expect(actual).toEqual(expected);
});

test("parse binary op +", () => {
    const tokens = tokenize('x + y'.trim());
    const actual = parseExpression(tokens, precedenceOf.lowestPrecedence);
    const expected = [{
        kind: 'binaryOp',
        value: {
            op: '+',
            left: { kind: 'symbol', value: 'x' },
            right: { kind: 'symbol', value: 'y' }
        }
    }, []];
    expect(actual).toEqual(expected);
});

test("parse binary op *", () => {
    const tokens = tokenize('x * y'.trim());
    const actual = parseExpression(tokens, precedenceOf.lowestPrecedence);
    const expected = [{
        kind: 'binaryOp',
        value: {
            op: '*',
            left: { kind: 'symbol', value: 'x' },
            right: { kind: 'symbol', value: 'y' }
        }
    }, []];
    expect(actual).toEqual(expected);
});

test("parse binary op + then *", () => {
    const tokens = tokenize('x + y * z'.trim());
    const actual = parseExpression(tokens, precedenceOf.lowestPrecedence);
    const expected = [{
        kind: 'binaryOp',
        value: {
            op: '+',
            left: { kind: 'symbol', value: 'x' },
            right: {
                kind: 'binaryOp',
                value: {
                    op: '*',
                    left: { kind: 'symbol', value: 'y' },
                    right: { kind: 'symbol', value: 'z' }
                }
            }
        }
    }, []];
    expect(actual).toEqual(expected);
});

test("parse binary op * then +", () => {
    const tokens = tokenize('x * y + z'.trim());
    const actual = parseExpression(tokens, precedenceOf.lowestPrecedence);
    const expected = [{
        kind: 'binaryOp',
        value: {
            op: '+',
            left: {
                kind: 'binaryOp',
                value: {
                    op: '*',
                    left: { kind: 'symbol', value: 'x' },
                    right: { kind: 'symbol', value: 'y' }
                }
            },
            right: { kind: 'symbol', value: 'z' },
        }
    }, []];
    expect(actual).toEqual(expected);
});

test("parse function definition with block for body", () => {
    const tokens = tokenize(`
        fn(x: i64, y: i64) -> i64 {
            x2 = x * x
            y2 = y * y
            x2 + y2
        }
    `.trim());
    const actual = parseExpression(tokens, precedenceOf.lowestPrecedence);
    const expected = [{
        kind: "function",
        value: {
            parameters: [
                {
                    name: "x",
                    type: { kind: "symbol", value: "i64" }
                },
                {
                    name: "y",
                    type: { kind: "symbol", value: "i64" }
                }
            ],
            returnType: { kind: "symbol", value: "i64" },
            body: {
                kind: "block",
                value: [
                    {
                        kind: "define",
                        value: {
                            name: "x2",
                            value: {
                                kind: "binaryOp",
                                value: {
                                    op: "*",
                                    left: { kind: "symbol", value: "x" },
                                    right: { kind: "symbol", value: "x" }
                                }
                            }
                        }
                    },
                    {
                        kind: "define",
                        value: {
                            name: "y2",
                            value: {
                                kind: "binaryOp",
                                value: {
                                    op: "*",
                                    left: { kind: "symbol", value: "y" },
                                    right: { kind: "symbol", value: "y" }
                                }
                            }
                        }
                    },
                    {
                        kind: "binaryOp",
                        value: {
                            op: "+",
                            left: { kind: "symbol", value: "x2" },
                            right: { kind: "symbol", value: "y2" }
                        }
                    }
                ]
            }
        }
    }, []];
    expect(actual).toEqual(expected);
});
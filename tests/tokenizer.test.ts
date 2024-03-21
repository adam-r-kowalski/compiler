import { expect, test } from "vitest";
import { tokenize } from "../src/tokenizer";

test("tokenize symbol", () => {
  const actual = tokenize("foo bar baz snake_case camelCase PascalCase name2");
  const expected = [
    { kind: "symbol", value: "foo", span: [[0, 0], [0, 3]] },
    { kind: "symbol", value: "bar", span: [[0, 4], [0, 7]] },
    { kind: "symbol", value: "baz", span: [[0, 8], [0, 11]] },
    { kind: "symbol", value: "snake_case", span: [[0, 12], [0, 22]] },
    { kind: "symbol", value: "camelCase", span: [[0, 23], [0, 32]] },
    { kind: "symbol", value: "PascalCase", span: [[0, 33], [0, 43]] },
    { kind: "symbol", value: "name2", span: [[0, 44], [0, 49]] }
  ];
  expect(actual).toEqual(expected);
});

test("tokenize int", () => {
  const actual = tokenize("42 100 -10");
  const expected = [
    { kind: "int", value: "42", span: { start: { line: 0, column: 0 }, end: { line: 0, column: 2 } } },
    { kind: "int", value: "100", span: { start: { line: 0, column: 3 }, end: { line: 0, column: 6 } } },
    { kind: "operator", value: "-", span: { start: { line: 0, column: 7 }, end: { line: 0, column: 8 } } },
    { kind: "int", value: "10", span: { start: { line: 0, column: 8 }, end: { line: 0, column: 10 } } }
  ];
  expect(actual).toEqual(expected);
});

test("tokenize float", () => {
  const actual = tokenize("42.5 .3 -.24");
  const expected = [
    { kind: "float", value: "42.5", span: { start: { line: 0, column: 0 }, end: { line: 0, column: 4 } } },
    { kind: "float", value: ".3", span: { start: { line: 0, column: 5 }, end: { line: 0, column: 7 } } },
    { kind: "operator", value: "-", span: { start: { line: 0, column: 8 }, end: { line: 0, column: 9 } } },
    { kind: "float", value: ".24", span: { start: { line: 0, column: 9 }, end: { line: 0, column: 12 } } }
  ];
  expect(actual).toEqual(expected);
});

test("tokenize string", () => {
  const actual = tokenize('"foo" "bar" "baz" "Hello World"');
  const expected = [
    { kind: "string", value: "foo", span: { start: { line: 0, column: 0 }, end: { line: 0, column: 5 } } },
    { kind: "string", value: "bar", span: { start: { line: 0, column: 6 }, end: { line: 0, column: 11 } } },
    { kind: "string", value: "baz", span: { start: { line: 0, column: 12 }, end: { line: 0, column: 17 } } },
    { kind: "string", value: "Hello World", span: { start: { line: 0, column: 18 }, end: { line: 0, column: 31 } } }
  ];
  expect(actual).toEqual(expected);
});

test("tokenize delimiter", () => {
  const actual = tokenize("( ) [ ] { } , . : ->");
  const expected = [
    { kind: "delimiter", value: "(", span: { start: { line: 0, column: 0 }, end: { line: 0, column: 1 } } },
    { kind: "delimiter", value: ")", span: { start: { line: 0, column: 2 }, end: { line: 0, column: 3 } } },
    { kind: "delimiter", value: "[", span: { start: { line: 0, column: 4 }, end: { line: 0, column: 5 } } },
    { kind: "delimiter", value: "]", span: { start: { line: 0, column: 6 }, end: { line: 0, column: 7 } } },
    { kind: "delimiter", value: "{", span: { start: { line: 0, column: 8 }, end: { line: 0, column: 9 } } },
    { kind: "delimiter", value: "}", span: { start: { line: 0, column: 10 }, end: { line: 0, column: 11 } } },
    { kind: "delimiter", value: ",", span: { start: { line: 0, column: 12 }, end: { line: 0, column: 13 } } },
    { kind: "delimiter", value: ".", span: { start: { line: 0, column: 14 }, end: { line: 0, column: 15 } } },
    { kind: "delimiter", value: ":", span: { start: { line: 0, column: 16 }, end: { line: 0, column: 17 } } },
    { kind: "delimiter", value: "->", span: { start: { line: 0, column: 18 }, end: { line: 0, column: 20 } } }
  ];
  expect(actual).toEqual(expected);
});

test("tokenize operator", () => {
  const actual = tokenize("= + - / * > < == <= >=");
  const expected = [
    { kind: "operator", value: "=", span: { start: { line: 0, column: 0 }, end: { line: 0, column: 1 } } },
    { kind: "operator", value: "+", span: { start: { line: 0, column: 2 }, end: { line: 0, column: 3 } } },
    { kind: "operator", value: "-", span: { start: { line: 0, column: 4 }, end: { line: 0, column: 5 } } },
    { kind: "operator", value: "/", span: { start: { line: 0, column: 6 }, end: { line: 0, column: 7 } } },
    { kind: "operator", value: "*", span: { start: { line: 0, column: 8 }, end: { line: 0, column: 9 } } },
    { kind: "operator", value: ">", span: { start: { line: 0, column: 10 }, end: { line: 0, column: 11 } } },
    { kind: "operator", value: "<", span: { start: { line: 0, column: 12 }, end: { line: 0, column: 13 } } },
    { kind: "operator", value: "==", span: { start: { line: 0, column: 14 }, end: { line: 0, column: 16 } } },
    { kind: "operator", value: "<=", span: { start: { line: 0, column: 17 }, end: { line: 0, column: 19 } } },
    { kind: "operator", value: ">=", span: { start: { line: 0, column: 20 }, end: { line: 0, column: 22 } } },
  ];
  expect(actual).toEqual(expected);
});

test("tokenize newline", () => {
  const actual = tokenize(`

`);
  const expected = [
    { kind: "newline", span: { start: { line: 0, column: 0 }, end: { line: 1, column: 0 } } },
    { kind: "newline", span: { start: { line: 1, column: 0 }, end: { line: 2, column: 0 } } },
  ];
  expect(actual).toEqual(expected);
});

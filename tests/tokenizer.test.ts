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
    { kind: "int", value: "42", span: [[0, 0], [0, 2]] },
    { kind: "int", value: "100", span: [[0, 3], [0, 6]] },
    { kind: "operator", value: "-", span: [[0, 7], [0, 8]] },
    { kind: "int", value: "10", span: [[0, 8], [0, 10]] }
  ];
  expect(actual).toEqual(expected);
});

test("tokenize float", () => {
  const actual = tokenize("42.5 .3 -.24");
  const expected = [
    { kind: "float", value: "42.5", span: [[0, 0], [0, 4]] },
    { kind: "float", value: ".3", span: [[0, 5], [0, 7]] },
    { kind: "operator", value: "-", span: [[0, 8], [0, 9]] },
    { kind: "float", value: ".24", span: [[0, 9], [0, 12]] }
  ];
  expect(actual).toEqual(expected);
});

test("tokenize string", () => {
  const actual = tokenize('"foo" "bar" "baz" "Hello World"');
  const expected = [
    { kind: "string", value: "foo", span: [[0, 0], [0, 5]] },
    { kind: "string", value: "bar", span: [[0, 6], [0, 11]] },
    { kind: "string", value: "baz", span: [[0, 12], [0, 17]] },
    { kind: "string", value: "Hello World", span: [[0, 18], [0, 31]] }
  ];
  expect(actual).toEqual(expected);
});

test("tokenize delimiter", () => {
  const actual = tokenize("( ) [ ] { } , . : ->");
  const expected = [
    { kind: "delimiter", value: "(", span: [[0, 0], [0, 1]] },
    { kind: "delimiter", value: ")", span: [[0, 2], [0, 3]] },
    { kind: "delimiter", value: "[", span: [[0, 4], [0, 5]] },
    { kind: "delimiter", value: "]", span: [[0, 6], [0, 7]] },
    { kind: "delimiter", value: "{", span: [[0, 8], [0, 9]] },
    { kind: "delimiter", value: "}", span: [[0, 10], [0, 11]] },
    { kind: "delimiter", value: ",", span: [[0, 12], [0, 13]] },
    { kind: "delimiter", value: ".", span: [[0, 14], [0, 15]] },
    { kind: "delimiter", value: ":", span: [[0, 16], [0, 17]] },
    { kind: "delimiter", value: "->", span: [[0, 18], [0, 20]] }
  ];
  expect(actual).toEqual(expected);
});

test("tokenize operator", () => {
  const actual = tokenize("= + - / * > < == <= >=");
  const expected = [
    { kind: "operator", value: "=", span: [[0, 0], [0, 1]] },
    { kind: "operator", value: "+", span: [[0, 2], [0, 3]] },
    { kind: "operator", value: "-", span: [[0, 4], [0, 5]] },
    { kind: "operator", value: "/", span: [[0, 6], [0, 7]] },
    { kind: "operator", value: "*", span: [[0, 8], [0, 9]] },
    { kind: "operator", value: ">", span: [[0, 10], [0, 11]] },
    { kind: "operator", value: "<", span: [[0, 12], [0, 13]] },
    { kind: "operator", value: "==", span: [[0, 14], [0, 16]] },
    { kind: "operator", value: "<=", span: [[0, 17], [0, 19]] },
    { kind: "operator", value: ">=", span: [[0, 20], [0, 22]] },
  ];
  expect(actual).toEqual(expected);
});

test("tokenize newline", () => {
  const actual = tokenize('\n\n');
  const expected = [
    { kind: "newline", span: [[0, 0], [1, 0]] },
    { kind: "newline", span: [[1, 0], [2, 0]] },
  ];
  expect(actual).toEqual(expected);
});

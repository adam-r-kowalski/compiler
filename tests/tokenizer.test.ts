import { expect, test } from "vitest";
import { tokenize } from "../src/tokenizer";

test("tokenize symbol", () => {
  const actual = tokenize("foo bar baz snake_case camelCase PascalCase name2");
  const expected = [
    { kind: "symbol", value: "foo" },
    { kind: "symbol", value: "bar" },
    { kind: "symbol", value: "baz" },
    { kind: "symbol", value: "snake_case" },
    { kind: "symbol", value: "camelCase" },
    { kind: "symbol", value: "PascalCase" },
    { kind: "symbol", value: "name2" },
  ];
  expect(actual).toEqual(expected);
});

test("tokenize int", () => {
  const actual = tokenize("42 100 -10");
  const expected = [
    { kind: "int", value: "42" },
    { kind: "int", value: "100" },
    { kind: "operator", value: "-", },
    { kind: "int", value: "10" }
  ];
  expect(actual).toEqual(expected);
});

test("tokenize float", () => {
  const actual = tokenize("42.5 .3 -.24");
  const expected = [
    { kind: "float", value: "42.5" },
    { kind: "float", value: ".3" },
    { kind: "operator", value: "-", },
    { kind: "float", value: ".24" }
  ];
  expect(actual).toEqual(expected);
});

test("tokenize string", () => {
  const actual = tokenize('"foo" "bar" "baz" "Hello World"');
  const expected = [
    { kind: "string", value: "foo" },
    { kind: "string", value: "bar" },
    { kind: "string", value: "baz" },
    { kind: "string", value: "Hello World" }
  ];
  expect(actual).toEqual(expected);
});

test("tokenize delimiter", () => {
  const actual = tokenize("()[]{},.:");
  const expected = [
    { kind: "delimiter", value: "(" },
    { kind: "delimiter", value: ")" },
    { kind: "delimiter", value: "[", },
    { kind: "delimiter", value: "]" },
    { kind: "delimiter", value: "{", },
    { kind: "delimiter", value: "}" },
    { kind: "delimiter", value: "," },
    { kind: "delimiter", value: "." },
    { kind: "delimiter", value: ":" },
  ];
  expect(actual).toEqual(expected);
});

test("tokenize operator", () => {
  const actual = tokenize("=+-/*");
  const expected = [
    { kind: "operator", value: "=" },
    { kind: "operator", value: "+" },
    { kind: "operator", value: "-" },
    { kind: "operator", value: "/" },
    { kind: "operator", value: "*" },
  ];
  expect(actual).toEqual(expected);
});

test("tokenize newline", () => {
  const actual = tokenize(`
  
  `);
  const expected = [
    { kind: "newline" },
    { kind: "newline" },
  ];
  expect(actual).toEqual(expected);
});

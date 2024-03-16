import { expect, test } from "vitest";
import { tokenize } from "../src/tokenizer";

test("tokenize symbol", () => {
  const actual = tokenize("foo bar baz");
  const expected = [
    { symbol: "foo" },
    { symbol: "bar" },
    { symbol: "baz" }
  ];
  expect(actual).toEqual(expected);
});

test("tokenize int", () => {
  const actual = tokenize("42 100 -10");
  const expected = [
    { int: "42" },
    { int: "100" },
    { symbol: "-", },
    { int: "10" }
  ];
  expect(actual).toEqual(expected);
});

test("tokenize float", () => {
  const actual = tokenize("42.5 .3 -.24");
  const expected = [
    { float: "42.5" },
    { float: ".3" },
    { symbol: "-", },
    { float: ".24" }
  ];
  expect(actual).toEqual(expected);
});

test("tokenize string", () => {
  const actual = tokenize('"foo" "bar" "baz"');
  const expected = [
    { string: "foo" },
    { string: "bar" },
    { string: "baz" }
  ];
  expect(actual).toEqual(expected);
});

test("tokenize delimiter", () => {
  const actual = tokenize("()[]{},.");
  const expected = [
    { delimiter: "(" },
    { delimiter: ")" },
    { delimiter: "[", },
    { delimiter: "]" },
    { delimiter: "{", },
    { delimiter: "}" },
    { delimiter: "," },
    { delimiter: "." },
  ];
  expect(actual).toEqual(expected);
});

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
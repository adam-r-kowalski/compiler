import { CompilerError } from "./compilerError";

export type Symbol = {
  kind: "symbol";
  value: string;
}

export type Int = {
  kind: "int";
  value: string;
}

export type Float = {
  kind: "float";
  value: string;
}

export type String = {
  kind: "string";
  value: string;
}

export type Delimiter = {
  kind: "delimiter";
  value: "(" | ")" | "[" | "]" | "{" | "}" | "," | "." | ":" | "->";
}

export type Operator = {
  kind: "operator";
  value: "=" | "+" | "-" | "*" | "/" | "<" | ">" | "<=" | ">=" | "==";
}

export type Newline = {
  kind: "newline";
}

export type Token
  = Symbol
  | Int
  | Float
  | String
  | Delimiter
  | Operator
  | Newline;

function isAlphabetic(char: string): boolean {
  const code = char.charCodeAt(0);
  return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}

function isNumeric(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= 48 && code <= 57;
}

function takeWhile(input: string, predicate: (char: string) => boolean): [string, string] {
  let i = 0;
  while (i < input.length && predicate(input[i])) {
    i++;
  }
  return [input.slice(0, i), input.slice(i)];
}

function takeWhileStatefull<State>(
  input: string,
  initial: State,
  predicate: (char: string, state: State) => [boolean, State]
): [string, string, State] {
  let i = 0;
  let state = initial;
  while (i < input.length) {
    const [condition, new_state] = predicate(input[i], state);
    if (!condition) break;
    state = new_state;
    i++;
  }
  return [input.slice(0, i), input.slice(i), state];
}

function tokenizeSymbol(input: string): [Symbol, string] {
  const [value, rest] = takeWhile(input, c => isAlphabetic(c) || isNumeric(c) || c === '_');
  return [{ kind: "symbol", value }, rest];
}

function tokenizeNumber(input: string): [Int | Float | Delimiter, string] {
  const [number, rest, isFloat] = takeWhileStatefull(input, false, (c, isFloat) => {
    if (c === '.' && !isFloat) {
      return [true, true];
    }
    return [isNumeric(c), isFloat]
  });
  if (isFloat) {
    if (number === '.') return [{ kind: "delimiter", value: '.' }, rest];
    return [{ kind: "float", value: number }, rest];
  }
  return [{ kind: "int", value: number }, rest];
}

function tokenizeString(input: string): [String, string] {
  const [value, rest] = takeWhile(input, c => c !== '"');
  return [{ kind: "string", value }, rest.slice(1)];
}

function either(input: string, oneLetter: Delimiter | Operator, twoLetter: Delimiter | Operator): [Token, string] {
  if (input.length > 1 && input[1] === twoLetter.value[1]) return [twoLetter, input.slice(2)];
  return [oneLetter, input.slice(1)];
}

function nextToken(input: string): [Token, string] {
  const c = input[0];
  if (isAlphabetic(c) || c === '_') return tokenizeSymbol(input);
  if (isNumeric(c) || c === '.') return tokenizeNumber(input);
  if (c === '"') return tokenizeString(input.slice(1))
  if (c === '-') return either(input, { kind: "operator", value: '-' }, { kind: "delimiter", value: '->' });
  if (c === '<') return either(input, { kind: "operator", value: '<' }, { kind: "operator", value: '<=' });
  if (c === '>') return either(input, { kind: "operator", value: '>' }, { kind: "operator", value: '>=' });
  if (c === '=') return either(input, { kind: "operator", value: '=' }, { kind: "operator", value: '==' });
  if (c === '(') return [{ kind: "delimiter", value: '(', }, input.slice(1)];
  if (c === ')') return [{ kind: "delimiter", value: ')', }, input.slice(1)];
  if (c === '[') return [{ kind: "delimiter", value: '[', }, input.slice(1)];
  if (c === ']') return [{ kind: "delimiter", value: ']', }, input.slice(1)];
  if (c === '{') return [{ kind: "delimiter", value: '{', }, input.slice(1)];
  if (c === '}') return [{ kind: "delimiter", value: '}', }, input.slice(1)];
  if (c === ',') return [{ kind: "delimiter", value: ',', }, input.slice(1)];
  if (c === ':') return [{ kind: "delimiter", value: ':', }, input.slice(1)];
  if (c === '+') return [{ kind: "operator", value: '+', }, input.slice(1)];
  if (c === '/') return [{ kind: "operator", value: '/', }, input.slice(1)];
  if (c === '*') return [{ kind: "operator", value: '*', }, input.slice(1)];
  if (c === '\n') return [{ kind: "newline" }, input.slice(1)];
  throw new CompilerError({
    kind: "invalid token",
    token: c,
    span: {
      start: { line: 0, column: 0 },
      end: { line: 0, column: 0 }
    }
  });
}

export function tokenize(input: string): Token[] {
  let tokens = [];
  while (true) {
    const [_, input2] = takeWhile(input, c => c === ' ');
    if (input2.length === 0) return tokens;
    const [token, input3] = nextToken(input2);
    input = input3;
    tokens.push(token);
  }
}

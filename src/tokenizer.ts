import { CompilerError } from "./compilerError";
import type { Span, Position } from "./span";

export type Symbol = {
  kind: "symbol";
  value: string;
  span: Span;
}

export type Int = {
  kind: "int";
  value: string;
  span: Span;
}

export type Float = {
  kind: "float";
  value: string;
  span: Span;
}

export type String = {
  kind: "string";
  value: string;
  span: Span;
}

export type DelimiterKind = "(" | ")" | "[" | "]" | "{" | "}" | "," | "." | ":" | "->";

export type Delimiter = {
  kind: "delimiter";
  value: DelimiterKind;
  span: Span;
}

export type OperatorKind = "=" | "+" | "-" | "*" | "/" | "<" | ">" | "<=" | ">=" | "==";

export type Operator = {
  kind: "operator";
  value: OperatorKind;
  span: Span;
}

export type Newline = {
  kind: "newline";
  span: Span;
}

export type Token
  = Symbol
  | Int
  | Float
  | String
  | Delimiter
  | Operator
  | Newline;

type Cursor = {
  span: Span;
  input: string;
}

function isAlphabetic(char: string): boolean {
  const code = char.charCodeAt(0);
  return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}

function isNumeric(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= 48 && code <= 57;
}

function takeWhile(cursor: Cursor, predicate: (char: string) => boolean): [string, Span, Cursor] {
  let i = 0;
  while (i < cursor.input.length && predicate(cursor.input[i])) {
    i++;
  }
  const taken = cursor.input.slice(0, i);
  const start = cursor.span[0];
  const end: Position = [start[0], start[1] + i];
  const span: Span = [start, end];
  const next_span: Span = [end, end];
  const next_cursor = { span: next_span, input: cursor.input.slice(i) }
  return [taken, span, next_cursor];
}

function takeWhileStatefull<State>(
  cursor: Cursor,
  initial: State,
  predicate: (char: string, state: State) => [boolean, State]
): [string, Span, Cursor, State] {
  let i = 0;
  let state = initial;
  while (i < cursor.input.length) {
    const [condition, new_state] = predicate(cursor.input[i], state);
    if (!condition) break;
    state = new_state;
    i++;
  }
  const taken = cursor.input.slice(0, i);
  const start = cursor.span[0];
  const end: Position = [start[0], start[1] + i];
  const span: Span = [start, end];
  const next_span: Span = [end, end];
  const next_cursor = { span: next_span, input: cursor.input.slice(i) }
  return [taken, span, next_cursor, state];
}

function tokenizeSymbol(cursor: Cursor): [Symbol, Cursor] {
  const [value, span, cursor2] = takeWhile(cursor, c => isAlphabetic(c) || isNumeric(c) || c === '_');
  return [{ kind: "symbol", value, span }, cursor2];
}

function tokenizeNumber(cursor: Cursor): [Int | Float | Delimiter, Cursor] {
  const [value, span, cursor2, isFloat] = takeWhileStatefull(cursor, false, (c, isFloat) => {
    if (c === '.' && !isFloat) {
      return [true, true];
    }
    return [isNumeric(c), isFloat]
  });
  if (isFloat) {
    if (value === '.') return [{ kind: "delimiter", value: '.', span }, cursor2];
    return [{ kind: "float", value, span }, cursor2];
  }
  return [{ kind: "int", value, span }, cursor2];
}

function advance(cursor: Cursor, by: number): Cursor {
  const input = cursor.input.slice(by);
  const start: Position = [cursor.span[0][0], cursor.span[0][1]];
  const end = cursor.span[1];
  const span: Span = [start, end];
  return { span, input };
}

function tokenizeString(cursor: Cursor): [String, Cursor] {
  let [value, span, cursor2] = takeWhile(cursor, c => c !== '"');
  cursor2 = advance(cursor2, 1);
  span[0][1] -= 1;
  span[1][1] += 1;
  return [{ kind: "string", value, span }, cursor2];
}

function either(
  cursor: Cursor,
  oneLetter: Delimiter | Operator,
  twoLetter: Delimiter | Operator
): [Token, Cursor] {
  if (cursor.input.length > 1 && cursor.input[1] === twoLetter.value[1]) {
    return [twoLetter, advance(cursor, 2)];
  }
  return [oneLetter, advance(cursor, 1)];
}

function operatorFor(cursor: Cursor, value: OperatorKind): Operator {
  const start = cursor.span[0];
  const end: Position = [start[0], start[1] + value.length];
  const span: Span = [start, end];
  return { kind: "operator", value, span };
}

function delimiterFor(cursor: Cursor, value: DelimiterKind): Delimiter {
  const start = cursor.span[0];
  const end: Position = [start[0], start[1] + value.length];
  const span: Span = [start, end];
  return { kind: "delimiter", value, span };
}

function newline(cursor: Cursor): [Newline, Cursor] {
  const span: Span = [cursor.span[0], [cursor.span[0][0] + 1, 0]];
  const input = cursor.input.slice(1);
  const next_span: Span = [span[1], span[1]];
  return [{ kind: "newline", span }, { span: next_span, input }];
}

function nextToken(cursor: Cursor): [Token, Cursor] {
  const c = cursor.input[0];
  if (isAlphabetic(c) || c === '_') return tokenizeSymbol(cursor);
  if (isNumeric(c) || c === '.') return tokenizeNumber(cursor);
  if (c === '"') return tokenizeString(advance(cursor, 1))
  const operator = operatorFor.bind(null, cursor);
  const delimiter = delimiterFor.bind(null, cursor);
  const next_cursor = advance(cursor, 1);
  if (c === '-') return either(cursor, operator('-'), delimiter('->'));
  if (c === '<') return either(cursor, operator('<'), operator('<='));
  if (c === '>') return either(cursor, operator('>'), operator('>='));
  if (c === '=') return either(cursor, operator('='), operator('=='));
  if (c === '(') return [delimiter('('), next_cursor];
  if (c === ')') return [delimiter(')'), next_cursor];
  if (c === '[') return [delimiter('['), next_cursor];
  if (c === ']') return [delimiter(']'), next_cursor];
  if (c === '{') return [delimiter('{'), next_cursor];
  if (c === '}') return [delimiter('}'), next_cursor];
  if (c === ',') return [delimiter(','), next_cursor];
  if (c === ':') return [delimiter(':'), next_cursor];
  if (c === '+') return [operator('+'), next_cursor];
  if (c === '/') return [operator('/'), next_cursor];
  if (c === '*') return [operator('*'), next_cursor];
  if (c === '\n') return newline(cursor);
  throw new CompilerError({
    kind: "tokenization invalid character error",
    character: c,
    span: [[0, 0], [0, 0]]
  });
}

export function tokenize(input: string): Token[] {
  let tokens = [];
  const span: Span = [[0, 0], [0, 0]];
  let cursor = { span, input };
  while (true) {
    const [_, _2, cursor2] = takeWhile(cursor, c => c === ' ');
    cursor = cursor2;
    if (cursor.input.length === 0) return tokens;
    const [token, cursor3] = nextToken(cursor);
    cursor = cursor3;
    tokens.push(token);
  }
}

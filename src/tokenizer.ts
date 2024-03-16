type SymbolToken = {
  symbol: string;
}

type IntToken = {
  int: string;
}

type FloatToken = {
  float: string;
}

type StringToken = {
  string: string;
}

type DelimiterToken = {
  delimiter: string;
}

type Token = SymbolToken
  | IntToken
  | FloatToken
  | StringToken
  | DelimiterToken;

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


function tokenizeSymbol(input: string): [SymbolToken, string] {
  const [symbol, rest] = takeWhile(input, isAlphabetic);
  return [{ symbol }, rest];
}

function tokenizeNumber(input: string): [IntToken | FloatToken, string] {
  const [number, rest, isFloat] = takeWhileStatefull(input, false, (c, isFloat) => {
    if (c === '.' && !isFloat) {
      return [true, true];
    }
    return [isNumeric(c), isFloat]
  });
  return isFloat ? [{ float: number }, rest] : [{ int: number }, rest];
}

function tokenizeString(input: string): [StringToken, string] {
  const [string, rest] = takeWhile(input, c => c !== '"');
  return [{ string }, rest.slice(1)];
}

function nextToken(input: string): [Token, string] {
  const c = input[0];
  if (isAlphabetic(c)) return tokenizeSymbol(input);
  if (isNumeric(c) || c === '.') return tokenizeNumber(input);
  if (c === '"') return tokenizeString(input.slice(1))
  if (c === '-') return [{ symbol: '-', }, input.slice(1)];
  if (c === '(') return [{ delimiter: '(', }, input.slice(1)];
  if (c === ')') return [{ delimiter: ')', }, input.slice(1)];
  if (c === '[') return [{ delimiter: '[', }, input.slice(1)];
  if (c === ']') return [{ delimiter: ']', }, input.slice(1)];
  if (c === '{') return [{ delimiter: '{', }, input.slice(1)];
  if (c === '}') return [{ delimiter: '}', }, input.slice(1)];
  throw new Error(`Unexpected character: ${c}`);
}

export function tokenize(input: string): Token[] {
  let tokens = [];
  while (true) {
    input = input.trimStart();
    if (input.length === 0) return tokens;
    const [token, rest] = nextToken(input);
    input = rest;
    tokens.push(token);
  }
}

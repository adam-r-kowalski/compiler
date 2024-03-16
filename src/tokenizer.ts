type SymbolToken = {
  symbol: string;
}

type IntegerToken = {
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
  | IntegerToken
  | FloatToken
  | StringToken
  | DelimiterToken;

function isAlphabetic(char: string): boolean {
  return /^[A-Za-z]$/.test(char);
}

function isNumeric(char: string): boolean {
  return /^[0-9]$/.test(char);
}

function takeWhile(input: string, predicate: (char: string) => boolean): [string, string] {
  let i = 0;
  while (predicate(input[i])) {
    i++;
  }
  return [input.slice(0, i), input.slice(i)];
}

function takeWhileStatefull<State>(input: string, initial: State, predicate: (char: string, state: State) => [boolean, State]): [string, string, State] {
  let i = 0;
  let state = initial;
  while (true) {
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

function tokenizeNumber(input: string): [IntegerToken | FloatToken, string] {
  const [number, rest, isFloat] = takeWhileStatefull(input, false, (c, isFloat) => {
    if (c === '.' && !isFloat) {
      return [true, true];
    }
    return [isNumeric(c), isFloat]
  });
  return isFloat ? [{ float: number }, rest] : [{ int: number }, rest];
}

function nextToken(input: string): [Token, string] {
  const c = input[0];
  if (isAlphabetic(c)) return tokenizeSymbol(input);
  if (isNumeric(c) || c === '.') return tokenizeNumber(input);
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

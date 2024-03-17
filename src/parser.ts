import type { Token, Delimiter, Symbol, Int, Float } from './tokenizer'

export type FunctionCall = {
    kind: "call";
    value: {
        function: Expression;
        arguments: Expression[];
    }
}

export type Expression = Symbol | Int | Float | FunctionCall;

export type Ast = {
    [name: string]: Expression;
}

function parsePrefix(tokens: Token[]): [Expression, Token[]] {
    if (tokens.length === 0) throw new Error('Unexpected end of input');
    const token = tokens[0];
    switch (token.kind) {
        case "symbol": return [token, tokens.slice(1)];
        case "int": return [token, tokens.slice(1)];
        case "float": return [token, tokens.slice(1)];
        case "string": return [token, tokens.slice(1)];
        default: throw new Error(`Unexpected token: ${JSON.stringify(token)}`);
    }
}

type InfixParser = (tokens: Token[], prefix: Expression) => [Expression, Token[]];

function parseFunctionCall(tokens: Token[], prefix: Expression): [Expression, Token[]] {
    tokens = tokens.slice(1);
    const args: Expression[] = []
    while (tokens.length !== 0) {
        const token = tokens[0]
        if (token.kind === 'delimiter') {
            switch (token.value) {
                case ')': return [{
                    kind: "call",
                    value: { function: prefix, arguments: args }
                }, tokens.slice(1)]
                case ',': tokens = tokens.slice(1); break;
                default: break;
            }
        }
        const [argument, rest] = parseExpression(tokens);
        args.push(argument);
        tokens = rest;
    }
    throw new Error('Unexpected end of input');
}

function infixParserForDelimiter(delimiter: Delimiter): InfixParser | null {
    switch (delimiter.value) {
        case "(": return parseFunctionCall;
        default: return null
    }
}

function infixParserFor(tokens: Token[]): InfixParser | null {
    if (tokens.length === 0) return null;
    const token = tokens[0];
    switch (token.kind) {
        case "delimiter": return infixParserForDelimiter(token);
        default: return null;
    }
}

export function parseExpression(tokens: Token[]): [Expression, Token[]] {
    const [prefix, tokens2] = parsePrefix(tokens);
    const parseInfix = infixParserFor(tokens2);
    if (parseInfix === null) return [prefix, tokens2];
    return parseInfix(tokens2, prefix)
}

export function parse(input: Token[]): Ast {
    return {};
}
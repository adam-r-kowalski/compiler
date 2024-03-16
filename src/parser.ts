import type { Token } from './tokenizer'

type Symbol = {
    kind: "symbol";
    value: string;
}

type Int = {
    kind: "int";
    value: string;
}

export type Expression = Symbol | Int;

export type Ast = {
    [name: string]: Expression;
}

export function parseExpression(tokens: Token[]): [Expression, Token[]] {
    if (tokens.length === 0) throw new Error('Unexpected end of input');
    const token = tokens[0];
    switch (token.kind) {
        case "symbol": return [token, tokens.slice(1)];
        case "int": return [token, tokens.slice(1)];
        default: throw new Error(`Unexpected token: ${JSON.stringify(token)}`);
    }
}

export function parse(input: Token[]): Ast {
    return {};
}
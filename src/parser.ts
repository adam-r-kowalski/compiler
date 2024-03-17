import type { Token, Delimiter, Symbol, Int, Float, String } from './tokenizer'

export type Call = {
    kind: "call";
    value: {
        function: Expression;
        arguments: Expression[];
    }
}

export type Parameter = {
    name: string;
    type: Expression;
}

export type Function = {
    kind: "function";
    value: {
        parameters: Parameter[];
        body: Expression;
    }
}

export type Expression = Symbol | Int | Float | String | Call | Function;

export type Ast = { [name: string]: Expression };

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

function parseCall(tokens: Token[], prefix: Expression): [Expression, Token[]] {
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

function infixParserForDelimiter(delimiter: Delimiter, prefix: Expression): InfixParser | null {
    switch (delimiter.value) {
        case "(": switch (prefix.kind) {
            case 'symbol': switch (prefix.value) {
                case "fn": return parseFunction;
                default: return parseCall;
            }
            default: return parseCall;
        }
        default: return null
    }
}

function consume(tokens: Token[], expected: Token): Token[] {
    if (tokens.length === 0) throw new Error('Unexpected end of input');
    const token = tokens[0];
    if (token.kind !== expected.kind || token.value !== expected.value) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(token)}`);
    }
    return tokens.slice(1);
}

function parseFunctionParameters(tokens: Token[], _: Expression): [Parameter[], Token[]] {
    const parameters: Parameter[] = []
    while (tokens.length !== 0) {
        const token = tokens[0];
        switch (token.kind) {
            case "symbol":
                tokens = consume(tokens.slice(1), { kind: "delimiter", value: ":" });
                const [type, rest] = parseExpression(tokens);
                tokens = rest;
                parameters.push({ name: token.value, type });
                break;
            case "delimiter":
                switch (token.value) {
                    case ")": return [parameters, tokens.slice(1)];
                    case ",": tokens = tokens.slice(1); break;
                    default: throw new Error(`Unexpected token: ${JSON.stringify(token)}`);
                }
                break
            default: throw new Error(`Unexpected token: ${JSON.stringify(token)}`);
        }
    }
    throw new Error('Unexpected end of input');
}

function trimNewlines(tokens: Token[]): Token[] {
    while (tokens.length !== 0) {
        const token = tokens[0];
        if (token.kind === "newline") {
            tokens = tokens.slice(1);
        } else {
            return tokens;
        }
    }
    return tokens;
}

function parseFunction(tokens: Token[], _: Expression): [Expression, Token[]] {
    tokens = tokens.slice(1);
    const [parameters, rest] = parseFunctionParameters(tokens, _);
    tokens = consume(rest, { kind: "delimiter", value: "{" });
    tokens = trimNewlines(tokens);
    const [body, tokens2] = parseExpression(tokens);
    tokens = trimNewlines(tokens2);
    tokens = consume(tokens, { kind: "delimiter", value: "}" });
    return [{ kind: "function", value: { parameters, body } }, tokens]
}

function infixParserFor(tokens: Token[], prefix: Expression): InfixParser | null {
    if (tokens.length === 0) return null;
    const token = tokens[0];
    switch (token.kind) {
        case "delimiter": return infixParserForDelimiter(token, prefix);
        default: return null;
    }
}

export function parseExpression(tokens: Token[]): [Expression, Token[]] {
    const [prefix, tokens2] = parsePrefix(tokens);
    const parseInfix = infixParserFor(tokens2, prefix);
    if (parseInfix === null) return [prefix, tokens2];
    return parseInfix(tokens2, prefix)
}

export function parse(input: Token[]): Ast {
    return {};
}
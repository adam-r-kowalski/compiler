import type { Token, Delimiter, Symbol, Int, Float, String, Operator } from './tokenizer'
import type { Precedence } from './precedenceOf'
import * as precedenceOf from './precedenceOf'

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
        returnType: Expression;
        body: Expression;
    }
}

export type BinaryOpKind = "+" | "-" | "*" | "/";

export type BinaryOp = {
    kind: "binaryOp";
    value: {
        op: BinaryOpKind,
        left: Expression;
        right: Expression;
    }
}

export type Define = {
    kind: "define";
    value: {
        name: string,
        type?: Expression;
        value: Expression;
    }
}

export type Block = {
    kind: "block";
    value: Expression[];
}

export type If = {
    kind: "if";
    value: {
        condition: Expression;
        then: Expression;
        else: Expression;
    }

}

export type Expression
    = Symbol
    | Int
    | Float
    | String
    | Call
    | Function
    | BinaryOp
    | Define
    | Block
    | If

export type Ast = { [name: string]: Expression };

function parseConditional(tokens: Token[], precedence: Precedence): [Expression, Token[]] {
    const [condition, rest] = parseExpression(tokens, precedenceOf.lowestPrecedence);
    tokens = consume(rest, { kind: "delimiter", value: "{" });
    const [thenBranch, rest2] = parseExpression(tokens, precedence);
    tokens = consume(rest2, { kind: "delimiter", value: "}" });
    tokens = consume(tokens, { kind: "symbol", value: "else" });
    tokens = consume(tokens, { kind: "delimiter", value: "{" });
    const [elseBranch, rest3] = parseExpression(tokens, precedence);
    tokens = consume(rest3, { kind: "delimiter", value: "}" });
    return [{
        kind: "if",
        value: {
            condition,
            then: thenBranch,
            else: elseBranch,
        }
    }, tokens];

}

function parseFunctionParameters(tokens: Token[], precedence: Precedence): [Parameter[], Token[]] {
    const parameters: Parameter[] = []
    while (tokens.length !== 0) {
        const token = tokens[0];
        switch (token.kind) {
            case "symbol":
                tokens = consume(tokens.slice(1), { kind: "delimiter", value: ":" });
                const [type, rest] = parseExpression(tokens, precedence);
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

function parseFunction(tokens: Token[], precedence: Precedence): [Expression, Token[]] {
    tokens = tokens.slice(1);
    const [parameters, rest] = parseFunctionParameters(tokens, precedence);
    tokens = consume(rest, { kind: "delimiter", value: "->" });
    const [returnType, rest2] = parseExpression(tokens, precedence);
    tokens = consume(rest2, { kind: "delimiter", value: "{" });
    const expressions: Expression[] = []
    while (tokens.length !== 0) {
        tokens = trimNewlines(tokens);
        const token = tokens[0];
        switch (token.kind) {
            case "delimiter":
                switch (token.value) {
                    case "}":
                        tokens = tokens.slice(1);
                        switch (expressions.length) {
                            case 0: throw new Error('Expected expression');
                            case 1: return [{
                                kind: "function",
                                value: { parameters, returnType, body: expressions[0] }
                            }, tokens]
                            default: return [{
                                kind: "function",
                                value: { parameters, returnType, body: { kind: "block", value: expressions } }
                            }, tokens]
                        }
                        break
                    default:
                        const [expression, newTokens] = parseExpression(tokens, precedenceOf.lowestPrecedence);
                        expressions.push(expression)
                        tokens = newTokens
                        break
                }
                break
            default:
                const [expression, newTokens] = parseExpression(tokens, precedenceOf.lowestPrecedence);
                expressions.push(expression)
                tokens = newTokens
                break
        }
    }
}


function parseSymbol(tokens: Token[], symbol: Symbol): [Expression, Token[]] {
    switch (symbol.value) {
        case "if": return parseConditional(tokens, precedenceOf.lowestPrecedence);
        case "fn": return parseFunction(tokens, precedenceOf.functionDefinition);
        default: return [symbol, tokens];
    }
}

function parsePrefix(tokens: Token[]): [Expression, Token[]] {
    if (tokens.length === 0) throw new Error('Unexpected end of input');
    const token = tokens[0];
    switch (token.kind) {
        case "symbol": return parseSymbol(tokens.slice(1), token);
        case "int": return [token, tokens.slice(1)];
        case "float": return [token, tokens.slice(1)];
        case "string": return [token, tokens.slice(1)];
        default: throw new Error(`Unexpected token: ${JSON.stringify(token)}`);
    }
}

type InfixParser = (tokens: Token[], prefix: Expression, precedence: Precedence) => [Expression, Token[]];

function parseCall(tokens: Token[], prefix: Expression, precedence: Precedence): [Expression, Token[]] {
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
        const [argument, rest] = parseExpression(tokens, precedence);
        args.push(argument);
        tokens = rest;
    }
    throw new Error('Unexpected end of input');
}

function parseDefineWithTypeAnnotation(tokens: Token[], name: Expression, precedence: Precedence): [Expression, Token[]] {
    if (name.kind !== "symbol") throw new Error('Expected symbol');
    tokens = tokens.slice(1);
    const [type, rest] = parseExpression(tokens, precedenceOf.variableDefinition + 1);
    tokens = consume(rest, { kind: "operator", value: "=" });
    const [value, rest2] = parseExpression(tokens, precedence);
    return [{ kind: "define", value: { name: name.value, type, value } }, rest2];
}

function infixParserForDelimiter(delimiter: Delimiter): [InfixParser, Precedence] | null {
    switch (delimiter.value) {
        case ":": return [parseDefineWithTypeAnnotation, precedenceOf.variableDefinition];
        case "(": return [parseCall, precedenceOf.functionCall];
        default: return null
    }
}

function consume(tokens: Token[], expected: Token): Token[] {
    if (tokens.length === 0) throw new Error('Unexpected end of input');
    const token = tokens[0];
    function valueOf(token: Token): string | null {
        switch (token.kind) {
            case "newline": return null;
            default: return token.value;
        }
    }
    if (token.kind !== expected.kind || valueOf(token) !== valueOf(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(token)}`);
    }
    return tokens.slice(1);
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

function parseBinaryOp(op: BinaryOpKind): [InfixParser, Precedence] {
    function parseInfix(tokens: Token[], left: Expression, precedence: Precedence): [Expression, Token[]] {
        tokens = tokens.slice(1);
        const [right, rest] = parseExpression(tokens, precedence);
        return [{ kind: "binaryOp", value: { op, left, right } }, rest];
    }
    return [parseInfix, precedenceOf.binaryOp[op]];
}

function parseDefine(tokens: Token[], name: Expression, precedence: Precedence): [Expression, Token[]] {
    if (name.kind !== "symbol") throw new Error('Expected symbol');
    tokens = tokens.slice(1);
    const [value, rest] = parseExpression(tokens, precedence);
    return [{ kind: "define", value: { name: name.value, value } }, rest];
}

function infixParserForOperator(operator: Operator): [InfixParser, Precedence] | null {
    switch (operator.value) {
        case "=": return [parseDefine, precedenceOf.variableDefinition];
        default: return parseBinaryOp(operator.value)
    }
}

function infixParserFor(token: Token): [InfixParser, Precedence] | null {
    switch (token.kind) {
        case "delimiter": return infixParserForDelimiter(token);
        case "operator": return infixParserForOperator(token);
        default: return null;
    }
}

export function parseExpression(tokens: Token[], precedence: Precedence): [Expression, Token[]] {
    let [prefix, rest] = parsePrefix(tokens);
    tokens = rest
    while (tokens.length !== 0) {
        const parseInfixAndPrecedence = infixParserFor(tokens[0]);
        if (parseInfixAndPrecedence === null) return [prefix, tokens];
        const [parseInfix, nextPrecedence] = parseInfixAndPrecedence;
        if (precedence > nextPrecedence) return [prefix, tokens];
        const [newPrefix, newTokens] = parseInfix(tokens, prefix, nextPrecedence)
        prefix = newPrefix
        tokens = newTokens
    }
    return [prefix, tokens]
}

export function parse(input: Token[]): Ast {
    return {};
}
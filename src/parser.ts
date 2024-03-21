import type { Token, Delimiter, Symbol, Int, Float, String, Operator } from './tokenizer'
import type { Precedence } from './precedenceOf'
import * as precedenceOf from './precedenceOf'
import { CompilerError } from './compilerError'
import type { Span, Position } from './span'
import type { S } from 'vitest/dist/reporters-P7C2ytIv.js'

export type Call = {
    kind: "call";
    value: {
        function: Expression;
        arguments: Expression[];
    };
    span: Span;
}

export type Parameter = {
    name: string;
    type: Expression;
    span: Span;
}

export type Function = {
    kind: "function";
    value: {
        parameters: Parameter[];
        returnType: Expression;
        body: Expression;
    };
    span: Span;
}

export type BinaryOpKind = "+" | "-" | "*" | "/" | "<" | ">" | "<=" | ">=" | "==";

export type BinaryOp = {
    kind: "binaryOp";
    value: {
        op: BinaryOpKind,
        left: Expression;
        right: Expression;
    };
    span: Span;
}

export type Define = {
    kind: "define";
    value: {
        name: string,
        type?: Expression;
        value: Expression;
    };
    span: Span;
}

export type Block = {
    kind: "block";
    value: Expression[];
    span: Span;
}

export type If = {
    kind: "if";
    value: {
        condition: Expression;
        then: Expression;
        else: Expression;
    }
    span: Span;
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

function parseConditional(tokens: Token[]): [Expression, Token[]] {
    const [condition, rest] = parseExpression(tokens, precedenceOf.lowestPrecedence);
    const [thenBranch, rest2] = parseBlock(rest);
    tokens = consume(rest2, "symbol", "else");
    const [elseBranch, rest3] = parseBlock(tokens);
    return [{
        kind: "if",
        value: {
            condition,
            then: thenBranch,
            else: elseBranch,
        },
        span: [[0, 0], [0, 0]]
    }, rest3];
}

function parseFunctionParameters(tokens: Token[], precedence: Precedence): [Parameter[], Token[]] {
    const parameters: Parameter[] = []
    while (tokens.length !== 0) {
        const token = tokens[0];
        switch (token.kind) {
            case "symbol":
                tokens = consume(tokens.slice(1), "delimiter", ":");
                const [type, rest] = parseExpression(tokens, precedence);
                tokens = rest;
                parameters.push({ name: token.value, type, span: token.span });
                break;
            case "delimiter":
                switch (token.value) {
                    case ")": return [parameters, tokens.slice(1)];
                    case ",": tokens = tokens.slice(1); break;
                    default: throw new CompilerError({
                        kind: "parsing function parameter invalid token error",
                        token,
                        span: [[0, 0], [0, 0]]
                    });
                }
                break
            default: throw new CompilerError({
                kind: "parsing function parameter invalid token error",
                token,
                span: [[0, 0], [0, 0]]
            });
        }
    }
    throw new CompilerError({
        kind: 'parsing function parameter expecting closing delimiter error',
        span: [[0, 0], [0, 0]]
    });
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

function parseBlock(tokens: Token[]): [Expression, Token[]] {
    const expressions: Expression[] = []
    tokens = consume(tokens, "delimiter", "{");
    while (true) {
        tokens = trimNewlines(tokens);
        if (tokens.length === 0) throw new CompilerError({
            kind: "parsing block expecting closing delimiter error",
            span: [[0, 0], [0, 0]]
        })
        const token = tokens[0];
        switch (token.kind) {
            case "delimiter":
                switch (token.value) {
                    case "}":
                        tokens = tokens.slice(1);
                        const span: Span = [[0, 0], [0, 0]]
                        switch (expressions.length) {
                            case 0: return [{ kind: "block", value: [], span }, tokens]
                            case 1: return [expressions[0], tokens];
                            default: return [{ kind: "block", value: expressions, span }, tokens]
                        }
                    default:
                        const [expression, newTokens] = parseExpression(tokens, precedenceOf.lowestPrecedence);
                        expressions.push(expression)
                        tokens = newTokens
                        break;
                }
                break
            default:
                const [expression, newTokens] = parseExpression(tokens, precedenceOf.lowestPrecedence);
                expressions.push(expression)
                tokens = newTokens
                break;
        }
    }
}

function parseFunction(tokens: Token[], precedence: Precedence): [Expression, Token[]] {
    tokens = tokens.slice(1);
    const [parameters, rest] = parseFunctionParameters(tokens, precedence);
    tokens = consume(rest, "delimiter", "->");
    const [returnType, rest2] = parseExpression(tokens, precedence);
    const [body, rest3] = parseBlock(rest2);
    return [{
        kind: "function",
        value: { parameters, returnType, body },
        span: [[0, 0], [0, 0]]
    }, rest3];
}

function parseSymbol(tokens: Token[], symbol: Symbol): [Expression, Token[]] {
    switch (symbol.value) {
        case "if": return parseConditional(tokens);
        case "fn": return parseFunction(tokens, precedenceOf.functionDefinition);
        default: return [symbol, tokens];
    }
}

function parsePrefix(tokens: Token[]): [Expression, Token[]] {
    if (tokens.length === 0) throw new CompilerError({
        kind: "parsing prefix expecting expression error",
        span: [[0, 0], [0, 0]]
    });
    const token = tokens[0];
    switch (token.kind) {
        case "symbol": return parseSymbol(tokens.slice(1), token);
        case "int": return [token, tokens.slice(1)];
        case "float": return [token, tokens.slice(1)];
        case "string": return [token, tokens.slice(1)];
        default: throw new CompilerError({
            kind: "parsing prefix invalid token error",
            token,
            span: [[0, 0], [0, 0]]
        });
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
                case ')':
                    const start: Position = prefix.span[0]
                    const end: Position = token.span[1]
                    const span: Span = [start, end]
                    return [{
                        kind: "call",
                        value: { function: prefix, arguments: args },
                        span: span
                    }, tokens.slice(1)]
                case ',': tokens = tokens.slice(1); break;
                default: break;
            }
        }
        const [argument, rest] = parseExpression(tokens, precedence);
        args.push(argument);
        tokens = rest;
    }
    throw new CompilerError({
        kind: "parsing call expecting closing delimiter error",
        span: [[0, 0], [0, 0]]
    });
}

function parseDefineWithTypeAnnotation(tokens: Token[], name: Expression, precedence: Precedence): [Expression, Token[]] {
    if (name.kind !== "symbol") throw new CompilerError({
        kind: "parse define expecting symbol error",
        name,
        span: [[0, 0], [0, 0]]
    });
    tokens = tokens.slice(1);
    const [type, rest] = parseExpression(tokens, precedenceOf.variableDefinition + 1);
    tokens = consume(rest, "operator", "=");
    const [value, rest2] = parseExpression(tokens, precedence);
    const span: Span = [[0, 0], [0, 0]];
    return [{ kind: "define", value: { name: name.value, type, value }, span }, rest2];
}

function infixParserForDelimiter(delimiter: Delimiter): [InfixParser, Precedence] | null {
    switch (delimiter.value) {
        case ":": return [parseDefineWithTypeAnnotation, precedenceOf.variableDefinition];
        case "(": return [parseCall, precedenceOf.functionCall];
        default: return null
    }
}

function consume(tokens: Token[], kind: 'symbol' | 'delimiter' | 'operator', value: string): Token[] {
    if (tokens.length === 0) throw new CompilerError({
        kind: "consume expecting expression error",
        span: [[0, 0], [0, 0]]
    });
    const token = tokens[0];
    if (token.kind !== kind || token.value !== value) {
        throw new CompilerError({
            kind: "consume invalid token error",
            expected: { kind, value },
            actual: token,
            span: [[0, 0], [0, 0]]
        })
    }
    return tokens.slice(1);
}

function parseBinaryOp(op: BinaryOpKind): [InfixParser, Precedence] {
    function parseInfix(tokens: Token[], left: Expression, precedence: Precedence): [Expression, Token[]] {
        tokens = tokens.slice(1);
        const [right, rest] = parseExpression(tokens, precedence);
        const span: Span = [[0, 0], [0, 0]];
        return [{ kind: "binaryOp", value: { op, left, right }, span }, rest];
    }
    return [parseInfix, precedenceOf.binaryOp[op]];
}

function parseDefine(tokens: Token[], name: Expression, precedence: Precedence): [Expression, Token[]] {
    if (name.kind !== "symbol") throw new CompilerError({
        kind: "parse define expecting symbol error",
        name,
        span: [[0, 0], [0, 0]]
    });
    tokens = tokens.slice(1);
    const [value, rest] = parseExpression(tokens, precedence);
    const span: Span = [[0, 0], [0, 0]];
    return [{ kind: "define", value: { name: name.value, value }, span }, rest];
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
    let ast: Ast = {};
    input = trimNewlines(input);
    while (true) {
        input = trimNewlines(input);
        if (input.length === 0) return ast;
        const [expression, rest] = parseExpression(input, precedenceOf.lowestPrecedence);
        input = rest;
        switch (expression.kind) {
            case "define":
                ast[expression.value.name] = expression.value.value;
                break;
            default:
                throw new CompilerError({
                    kind: "parse invalid expression error",
                    expression,
                    span: [[0, 0], [0, 0]]
                });
        }
    }
    return ast;
}
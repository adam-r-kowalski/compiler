import type { Token, Delimiter, Symbol, Int, Float, String, Operator } from './tokenizer'
import type { Precedence } from './precedenceOf'
import * as precedenceOf from './precedenceOf'
import { CompilerError } from './compilerError'

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

export type BinaryOpKind = "+" | "-" | "*" | "/" | "<" | ">" | "<=" | ">=" | "==";

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

function parseConditional(tokens: Token[]): [Expression, Token[]] {
    const [condition, rest] = parseExpression(tokens, precedenceOf.lowestPrecedence);
    const [thenBranch, rest2] = parseBlock(rest);
    tokens = consume(rest2, { kind: "symbol", value: "else" });
    const [elseBranch, rest3] = parseBlock(tokens);
    return [{
        kind: "if",
        value: {
            condition,
            then: thenBranch,
            else: elseBranch,
        }
    }, rest3];

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
                    default: throw new CompilerError({
                        kind: "parsing function parameter invalid token error",
                        token,
                        span: { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } }
                    });
                }
                break
            default: throw new CompilerError({
                kind: "parsing function parameter invalid token error",
                token,
                span: { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } }
            });
        }
    }
    throw new CompilerError({
        kind: 'parsing function parameter expecting closing delimiter error',
        span: { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } }
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
    tokens = consume(tokens, { kind: "delimiter", value: "{" });
    while (true) {
        tokens = trimNewlines(tokens);
        if (tokens.length === 0) throw new CompilerError({
            kind: "parsing block expecting closing delimiter error",
            span: { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } }
        })
        const token = tokens[0];
        switch (token.kind) {
            case "delimiter":
                switch (token.value) {
                    case "}":
                        tokens = tokens.slice(1);
                        switch (expressions.length) {
                            case 0: return [{ kind: "block", value: [] }, tokens]
                            case 1: return [expressions[0], tokens];
                            default: return [{ kind: "block", value: expressions }, tokens]
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
    throw new CompilerError({
        kind: "parsing block expecting closing delimiter error",
        span: { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } }
    });
}

function parseFunction(tokens: Token[], precedence: Precedence): [Expression, Token[]] {
    tokens = tokens.slice(1);
    const [parameters, rest] = parseFunctionParameters(tokens, precedence);
    tokens = consume(rest, { kind: "delimiter", value: "->" });
    const [returnType, rest2] = parseExpression(tokens, precedence);
    const [body, rest3] = parseBlock(rest2);
    return [{
        kind: "function",
        value: { parameters, returnType, body }
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
        span: { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } }
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
            span: { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } }
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
    throw new CompilerError({
        kind: "parsing call expecting closing delimiter error",
        span: { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } }
    });
}

function parseDefineWithTypeAnnotation(tokens: Token[], name: Expression, precedence: Precedence): [Expression, Token[]] {
    if (name.kind !== "symbol") throw new CompilerError({
        kind: "parse define expecting symbol error",
        name,
        span: { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } }
    });
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
    if (tokens.length === 0) throw new CompilerError({
        kind: "consume expecting expression error",
        span: { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } }
    });
    const token = tokens[0];
    function valueOf(token: Token): string | null {
        switch (token.kind) {
            case "newline": return null;
            default: return token.value;
        }
    }
    if (token.kind !== expected.kind || valueOf(token) !== valueOf(expected)) {
        throw new CompilerError({
            kind: "consume invalid token error",
            expected,
            actual: token,
            span: { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } }
        })
    }
    return tokens.slice(1);
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
    if (name.kind !== "symbol") throw new CompilerError({
        kind: "parse define expecting symbol error",
        name,
        span: { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } }
    });
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
                    span: { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } }
                });
        }
    }
    return ast;
}
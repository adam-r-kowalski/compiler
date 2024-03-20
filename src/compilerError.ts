import type { Span } from './span';
import type { Token } from './tokenizer';
import type { Expression } from './parser';

export type TokenizationInvalidCharacterError = {
    kind: "tokenization invalid character error";
    character: string;
    span: Span;
}

export type ParsingFunctionParameterInvalidTokenError = {
    kind: "parsing function parameter invalid token error";
    token: Token;
    span: Span;
}

export type ParsingFunctionParameterExpectingClosingDelimiterError = {
    kind: "parsing function parameter expecting closing delimiter error";
    span: Span;
}

export type ParsingBlockExpectingClosingDelimiterError = {
    kind: "parsing block expecting closing delimiter error";
    span: Span;
}

export type ParsingPrefixExpectingExpressionError = {
    kind: "parsing prefix expecting expression error";
    span: Span;
}

export type ParsingPrefixInvalidTokenError = {
    kind: "parsing prefix invalid token error";
    token: Token;
    span: Span;
}


export type ParsingCallExpectingClosingDelimiterError = {
    kind: "parsing call expecting closing delimiter error";
    span: Span;
}

export type ParseDefineExpectingSymbolError = {
    kind: "parse define expecting symbol error";
    name: Expression;
    span: Span;
}

export type ConsumeExpectingExpressionError = {
    kind: "consume expecting expression error";
    span: Span;
}

export type ConsumeInvalidTokenError = {
    kind: "consume invalid token error";
    expected: Token;
    actual: Token;
    span: Span;
}

export type ParseInvalidExpressionError = {
    kind: "parse invalid expression error";
    expression: Expression;
    span: Span;
}

export type CompilerErrorMessage
    = TokenizationInvalidCharacterError
    | ParsingFunctionParameterInvalidTokenError
    | ParsingFunctionParameterExpectingClosingDelimiterError
    | ParsingBlockExpectingClosingDelimiterError
    | ParsingPrefixExpectingExpressionError
    | ParsingPrefixInvalidTokenError
    | ParsingCallExpectingClosingDelimiterError
    | ParseDefineExpectingSymbolError
    | ConsumeExpectingExpressionError
    | ConsumeInvalidTokenError
    | ParseInvalidExpressionError

export class CompilerError extends Error {
    constructor(public compilerErrorMessage: CompilerErrorMessage) {
        super(JSON.stringify(compilerErrorMessage, null, 4))
    }
}
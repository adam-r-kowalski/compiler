import type { Span } from './span';

export type InvalidTokenError = {
    kind: "invalid token";
    token: string;
    span: Span;
}

export type CompilerErrorMessage = InvalidTokenError

export class CompilerError extends Error {
    constructor(public compilerErrorMessage: CompilerErrorMessage) {
        super(JSON.stringify(compilerErrorMessage, null, 4))
    }
}
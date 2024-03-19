export type Position = {
    line: number;
    column: number;
}

export type Span = {
    start: Position;
    end: Position;
}
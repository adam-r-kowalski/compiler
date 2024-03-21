/**
 * Represents a line number in the source code.
 */
export type Line = number;

/**
 * Represents a column number in the source code.
 */
export type Column = number;

/**
 * Represents a [line, column] pair. For example:
 *
 * [0, 0] represents the first line and column
 * 
 * [1, 0] represents the second line and first column
 * 
 * [0, 1] represents the first line and second column
 */
export type Position = [Line, Column];

/**
 * Represents a [start, end] pair of positions.
 * 
 * Remember a position is a [line, column] pair.
 * 
 * For Example:
 * 
 * The span [[0, 0], [0, 1]]
 * 
 * Starts at line 0 and column 0
 * 
 * End at line 0 and column 1
 */
export type Span = [Position, Position];

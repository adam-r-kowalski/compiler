const delta = 10

export type Precedence = number

export const lowestPrecedence = 0
export const variableDefinition = lowestPrecedence + delta
export const functionDefinition = variableDefinition + delta
export const functionCall = functionDefinition + delta
export const add = functionCall + delta
export const subtract = add
export const multiply = add + delta
export const divide = multiply
export const binaryOp = {
    '+': add,
    '-': subtract,
    '*': multiply,
    '/': divide,
}
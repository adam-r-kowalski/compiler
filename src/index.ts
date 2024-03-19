import { tokenize } from './tokenizer'
import { parse } from './parser'

document.addEventListener('DOMContentLoaded', () => {
    const code = document.getElementById('code') as HTMLTextAreaElement
    const output = document.getElementById('output') as HTMLPreElement
    code.addEventListener('input', () => {
        console.log("input changed")
        let tokens = tokenize(code.value)
        let ast = parse(tokens)
        output.innerHTML = JSON.stringify(ast, null, 4)
    })
})

console.log("got here")
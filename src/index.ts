import { tokenize } from './tokenizer'
import { parse } from './parser'


document.addEventListener('DOMContentLoaded', () => {
    const code = document.getElementById('code') as HTMLTextAreaElement
    const output = document.getElementById('output') as HTMLPreElement
    const errorOutput = document.getElementById('error') as HTMLPreElement
    function updateAst() {
        try {
            let tokens = tokenize(code.value)
            let ast = parse(tokens)
            output.innerHTML = JSON.stringify(ast, null, 4)
            errorOutput.style.display = 'none'
        } catch (error) {
            console.warn(error)
            errorOutput.innerHTML = error.toString()
            errorOutput.style.display = 'block'
        }
    }
    updateAst()
    code.addEventListener('input', updateAst)
})


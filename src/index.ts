import { tokenize } from './tokenizer'
import { parse } from './parser'
import { CompilerError } from './compilerError'


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
            if (error instanceof CompilerError) {
                console.warn(error)
                errorOutput.innerHTML = error.message
                errorOutput.style.display = 'block'
            } else {
                console.warn(error)
                errorOutput.innerHTML = (error as any).toString()
                errorOutput.style.display = 'block'
            }
        }
    }
    updateAst()
    code.addEventListener('input', updateAst)
})


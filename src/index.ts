import { tokenize } from './tokenizer';
import { parse } from './parser';
import { CompilerError } from './compilerError';

document.addEventListener('DOMContentLoaded', () => {
    const codeEditor = document.getElementById('code-editor') as HTMLTextAreaElement;
    const astOutput = document.getElementById('ast-output') as HTMLPreElement;
    const errorMessages = document.getElementById('error-messages') as HTMLPreElement;
    let debounceTimer: number;

    function showError(message: string) {
        errorMessages.innerHTML = message;
        errorMessages.style.maxHeight = 'var(--max-error-height)';
        errorMessages.style.padding = 'var(--padding)';
    }

    function hideError() {
        errorMessages.style.maxHeight = '0';
        errorMessages.style.padding = '0';
    }

    function updateAst() {
        try {
            let tokens = tokenize(codeEditor.value);
            let ast = parse(tokens);
            astOutput.innerHTML = JSON.stringify(ast, null, 4);
            hideError();
        } catch (error) {
            console.warn(error);
            const errorMessage = (error instanceof CompilerError) ? error.message : (error as Error).message;
            showError(errorMessage);
        }
    }

    const debounceRate = 500;

    function debounceUpdateAst() {
        clearTimeout(debounceTimer);
        debounceTimer = window.setTimeout(() => {
            updateAst();
        }, debounceRate);
    }

    codeEditor.addEventListener('input', debounceUpdateAst);

    updateAst();
});

import { cpp }        from '@codemirror/lang-cpp';
import { javascript } from '@codemirror/lang-javascript';
import { html }       from '@codemirror/lang-html';
import { css }        from '@codemirror/lang-css';
import { java }       from '@codemirror/lang-java';
import { json }       from '@codemirror/lang-json';
import { markdown }   from '@codemirror/lang-markdown';
import { php }        from '@codemirror/lang-php';
import { python }     from '@codemirror/lang-python';
import { rust }       from '@codemirror/lang-rust';
import { sql }        from '@codemirror/lang-sql';
import { xml }        from '@codemirror/lang-xml';

export function highlightingExtension(postfix) {
    switch (postfix) {
        case 'js':
            return [javascript({jsx: true})];
        case 'jsx':
            return [javascript({jsx: true})];
        case 'hpp':
            return [cpp()];
        case 'h':
            return [cpp()];
        case 'c':
            return [cpp()];
        case 'cpp':
            return [cpp()];
        case 'html':
            return [html()];
        case 'css':
            return [css()];
        case 'java':
            return [java()];
        case 'json':
            return [json()];
        case 'md':
            return [markdown()];
        case 'php':
            return [php()];
        case 'py':
            return [python()];
        case 'rs':
            return [rust()];
        case 'sql':
            return [sql()];
        case 'xml':
            return [xml()];
        default:
            return [];
    }
}
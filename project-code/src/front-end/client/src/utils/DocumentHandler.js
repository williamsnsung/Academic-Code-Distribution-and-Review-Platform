import React    from 'react';
import ReactDOM from 'react-dom';

export function setEleText(id, innerText) {
    try {
        document.getElementById(id).innerText = innerText;
    } catch (ignore) {
    }
}

export function getEleValue(id) {
    return document.getElementById(id).value;
}

export function DOMrenderDivs(divs, ref) {
    try {
        ReactDOM.render(<div>{divs}</div>, ref);
    } catch (ignore) {
    }
}
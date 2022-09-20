import './index.css';
import Sandbox from '..';

// @ts-ignore
window.Sandbox = Sandbox;

const code = `
class Sandbox {
    constructor(options?: {
        onInit: (realm: Realm) => void;
    });
    evaluate(sourceText: string): any;
    evaluateHandle(func: (this: undefined) => any): any;
}

window.Sandbox = Sandbox;

`;

setTimeout(() => {
    const el = document.querySelector('.code') as HTMLPreElement;
    el.textContent = code;
});

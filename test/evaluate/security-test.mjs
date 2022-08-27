describe('Method "evaluate" security test', () => {
    const sandbox = new Sandbox();

    it('global object inside sandbox ', () => {
        const result = sandbox.evaluate(`
            const descMap = Object.getOwnPropertyDescriptors(globalThis);
            const list = [];
            for (const [key, desc] of Object.entries(descMap)) {
                if (
                    (desc.get && !(desc.get instanceof Object)) ||
                    (desc.set && !(desc.set instanceof Object)) ||
                    (desc.value &&
                        (typeof desc.value === 'object' ||
                            typeof desc.value === 'function') &&
                        !(desc.value instanceof Object))
                ) {
                    list.push(key);
                }
            }
            list.join('');
        `);
        expect(result).toBe('');
    });

    it('this', () => {
        const result = sandbox.evaluate(
            `Object.getPrototypeOf(this) === Object.prototype`
        );
        expect(result).toBeTruthy();
    });

    it('globalThis', () => {
        const result = sandbox.evaluate(
            `Object.getPrototypeOf(globalThis) === Object.prototype`
        );
        expect(result).toBeTruthy();
    });

    it('window', () => {
        const result = sandbox.evaluate(
            `Object.getPrototypeOf(window) === Object.prototype`
        );
        expect(result).toBeTruthy();
    });

    it('eval("this")', () => {
        const result = sandbox.evaluate(`eval("this") === globalThis`);
        expect(result).toBeTruthy();
    });

    it('eval("globalThis")', () => {
        const result = sandbox.evaluate(`eval("globalThis") === globalThis`);
        expect(result).toBeTruthy();
    });

    it('eval("window")', () => {
        const result = sandbox.evaluate(`eval("window") === globalThis`);
        expect(result).toBeTruthy();
    });

    it('Function("this")', () => {
        const result = sandbox.evaluate(
            `Function("return this")() === undefined`
        );
        expect(result).toBeTruthy();
    });

    it('Function("globalThis")', () => {
        const result = sandbox.evaluate(
            `Function("return globalThis")() === globalThis`
        );
        expect(result).toBeTruthy();
    });

    it('Function("window")', () => {
        const result = sandbox.evaluate(
            `Function("return window")() === globalThis`
        );
        expect(result).toBeTruthy();
    });
});

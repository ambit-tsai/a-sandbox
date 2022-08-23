describe('Method "evaluate" allows callable data', () => {
    const sandbox = new Sandbox();

    it('return traditional function', () => {
        const fn = sandbox.evaluate('(function(){return 123})');
        expect(fn instanceof Function).toBe(true);
        expect(fn()).toBe(123);
    });

    it('return arrow function', () => {
        const fn = sandbox.evaluate('() => 123');
        expect(fn instanceof Function).toBe(true);
        expect(fn()).toBe(123);
    });

    it('return async function', async () => {
        const fn = sandbox.evaluate('async () => 123');
        expect(fn instanceof Function).toBe(true);
        const result = fn();
        expect(result instanceof Promise).toBe(true);
        expect(await result).toBe(123);
    });

    it('sandbox function throws errors', () => {
        try {
            const fn = sandbox.evaluate('() => {throw new Error("hello")}');
            fn();
            throw 'never';
        } catch (error) {
            expect(error instanceof Error).toBe(true);
            expect(error.message).toBe('hello');
        }
    });
});

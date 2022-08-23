describe('Method "evaluate" throw errors', () => {
    const sandbox = new Sandbox();

    it('non-existent variable', () => {
        expect(() => {
            sandbox.evaluate('__NonExistent__');
        }).toThrowError(ReferenceError);
    });

    it('error from sandbox', () => {
        try {
            sandbox.evaluate('throw new Error("hello")');
        } catch (error) {
            expect(error instanceof Error).toBeTruthy();
            expect(error.message).toBe('hello');
            return;
        }
        throw 'never';
    });

    it('custom error from sandbox', () => {
        try {
            const fn = sandbox.evaluate(`
                class CustomError extends Error {};
                () => { throw new CustomError("hello") };
            `);
            fn();
        } catch (error) {
            expect(error instanceof Error).toBeTruthy();
            expect(error.message).toBe('hello');
            return;
        }
        throw 'never';
    });
});

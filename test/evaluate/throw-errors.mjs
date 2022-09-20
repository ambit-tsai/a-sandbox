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
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toBe('hello');
            return;
        }
        throw 'never';
    });

    it('custom error from sandbox', () => {
        try {
            sandbox.evaluate(`
                class CustomError extends Error {};
                throw new CustomError("hello");
            `);
        } catch (error) {
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toBe('hello');
            return;
        }
        throw 'never';
    });
});

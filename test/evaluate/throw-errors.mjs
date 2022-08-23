describe('Method "evaluate" throw errors', () => {
    const sandbox = new Sandbox();

    it('return unsupported data', () => {
        expect(() => {
            sandbox.evaluate('new FormData()');
        }).toThrowError(Error);
    });

    it('non-existent variable', () => {
        expect(() => {
            sandbox.evaluate('__NonExistent__');
        }).toThrowError(ReferenceError);
    });

    it('error from sandbox', () => {
        try {
            sandbox.evaluate('throw new Error("hello")');
            throw 'never';
        } catch (error) {
            expect(error instanceof Error).toBe(true);
            expect(error.message).toBe('hello');
        }
    });
});

describe('Method "evaluate" returns primitive data', () => {
    const sandbox = new Sandbox();

    it('return string', () => {
        const result = sandbox.evaluate('"hello"');
        expect(result).toBe('hello');
    });

    it('return number', () => {
        const result = sandbox.evaluate('123');
        expect(result).toBe(123);
    });

    it('return symbol', () => {
        const result = sandbox.evaluate('Symbol("hello")');
        expect(typeof result).toBe('symbol');
        expect(result.toString()).toBe('Symbol(hello)');
    });

    it('return boolean', () => {
        const result = sandbox.evaluate('true');
        expect(result).toBe(true);
    });

    it('return bigint', () => {
        const result = sandbox.evaluate('123n');
        expect(result).toBe(123n);
    });

    it('return undefined', () => {
        const result = sandbox.evaluate('');
        expect(result).toBeUndefined();
    });

    it('return null', () => {
        const result = sandbox.evaluate('null');
        expect(result).toBeNull();
    });
});

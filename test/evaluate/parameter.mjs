describe('Method "evaluate" parameter', () => {
    const sandbox = new Sandbox();

    it('string', () => {
        const result = sandbox.evaluate('123');
        expect(result).toBe(123);
    });

    it('boolean', () => {
        expect(() => {
            sandbox.evaluate(true);
        }).toThrowError(TypeError);
    });

    it('number', () => {
        expect(() => {
            sandbox.evaluate(123);
        }).toThrowError(TypeError);
    });

    it('bigint', () => {
        expect(() => {
            sandbox.evaluate(123n);
        }).toThrowError(TypeError);
    });

    it('symbol', () => {
        expect(() => {
            sandbox.evaluate(Symbol());
        }).toThrowError(TypeError);
    });

    it('null', () => {
        expect(() => {
            sandbox.evaluate(null);
        }).toThrowError(TypeError);
    });

    it('undefined', () => {
        expect(() => {
            sandbox.evaluate();
        }).toThrowError(TypeError);
    });

    it('object', () => {
        expect(() => {
            sandbox.evaluate({});
        }).toThrowError(TypeError);
    });

    it('invalid code string', () => {
        expect(() => {
            sandbox.evaluate('}{');
        }).toThrowError(SyntaxError);
    });
});

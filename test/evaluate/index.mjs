describe('Method "evaluate"', () => {
    const sandbox = new Sandbox();

    it('string as parameter', () => {
        const result = sandbox.evaluate('123');
        expect(result).toBe(123);
    });

    it('boolean as parameter', () => {
        expect(() => {
            sandbox.evaluate(true);
        }).toThrowError(TypeError);
    });

    it('number as parameter', () => {
        expect(() => {
            sandbox.evaluate(123);
        }).toThrowError(TypeError);
    });

    it('bigint as parameter', () => {
        expect(() => {
            sandbox.evaluate(123n);
        }).toThrowError(TypeError);
    });

    it('symbol as parameter', () => {
        expect(() => {
            sandbox.evaluate(Symbol());
        }).toThrowError(TypeError);
    });

    it('null as parameter', () => {
        expect(() => {
            sandbox.evaluate(null);
        }).toThrowError(TypeError);
    });

    it('undefined as parameter', () => {
        expect(() => {
            sandbox.evaluate();
        }).toThrowError(TypeError);
    });

    it('object as parameter', () => {
        expect(() => {
            sandbox.evaluate({});
        }).toThrowError(TypeError);
    });

    it('pass invalid code', () => {
        expect(() => {
            sandbox.evaluate('}{');
        }).toThrowError(SyntaxError);
    });
});

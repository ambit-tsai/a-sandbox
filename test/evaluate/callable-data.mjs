describe('Method "evaluate" returns callable data', () => {
    const sandbox = new Sandbox();

    it('return traditional function', () => {
        const fn = sandbox.evaluate('(function(){})');
        expect(fn instanceof Function).toBeTruthy();
    });

    it('return arrow function', () => {
        const fn = sandbox.evaluate('() => {}');
        expect(fn instanceof Function).toBeTruthy();
    });

    it('return async function', async () => {
        const fn = sandbox.evaluate('async () => 123');
        expect(fn instanceof Function).toBeTruthy();
        const result = fn();
        expect(result instanceof Promise).toBeTruthy();
        expect(await result).toBe(123);
    });

    it('wrapped function returns primitive data', () => {
        let fn;
        fn = sandbox.evaluate('() => 123');
        expect(fn()).toBe(123);
        fn = sandbox.evaluate('() => 123n');
        expect(fn()).toBe(123n);
        fn = sandbox.evaluate('() => "hello"');
        expect(fn()).toBe('hello');
        fn = sandbox.evaluate('() => true');
        expect(fn()).toBe(true);
        fn = sandbox.evaluate('() => null');
        expect(fn()).toBeNull();
        fn = sandbox.evaluate('() => undefined');
        expect(fn()).toBeUndefined();
        fn = sandbox.evaluate('() => Symbol("hello")');
        const result = fn();
        expect(typeof result).toBe('symbol');
        expect(result.toString()).toBe('Symbol(hello)');
    });

    it('wrapped function returns ArrayBuffer', () => {
        const result = sandbox.evaluate('new ArrayBuffer(8)');
        expect(result instanceof ArrayBuffer).toBeTruthy();
        expect(result.byteLength).toBe(8);
    });

    it('wrapped function returns DataView', () => {
        const result = sandbox.evaluate(`
            const buffer = new ArrayBuffer(8);
            new DataView(buffer);
        `);
        expect(result instanceof DataView).toBeTruthy();
        expect(result.byteLength).toBe(8);
    });

    it('wrapped function return TypedArray', () => {
        const result = sandbox.evaluate('new Uint8Array(8)');
        expect(result instanceof Uint8Array).toBeTruthy();
        expect(result.byteLength).toBe(8);
    });

    it('wrapped function return plain object', () => {
        const result = sandbox.evaluate('({ a: 123 })');
        expect(result instanceof Object).toBeTruthy();
        expect(result.a).toBe(123);
    });

    it('wrapped function return unstructured data', () => {
        expect(() => {
            sandbox.evaluate('new FormData()');
        }).toThrowError(Error);
    });

    it('wrapped function throws error', () => {
        try {
            const fn = sandbox.evaluate('() => {throw new Error("hello")}');
            fn();
        } catch (error) {
            expect(error instanceof Error).toBeTruthy();
            expect(error.message).toBe('hello');
            return;
        }
        throw 'never';
    });

    it('wrapped function throws primitive data', () => {
        check('123', 123);
        check('123n', 123n);
        check('true', true);
        check('null', null);
        check('undefined', undefined);
        check('"hello"', 'hello');
        check('Symbol("hello")', 'Symbol(hello)', true);

        function check(source, expected, isSymbol = false) {
            try {
                const fn = sandbox.evaluate(`() => {throw ${source}}`);
                fn();
            } catch (error) {
                if (isSymbol) {
                    expect(typeof error).toBe('symbol');
                    expect(error.toString()).toBe(expected);
                } else {
                    expect(error).toBe(expected);
                }
                return;
            }
            throw 'never';
        }
    });

    it('wrapped function throws custom error', () => {
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

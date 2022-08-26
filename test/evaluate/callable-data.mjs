describe('Method "evaluate" returns callable data', () => {
    const sandbox = new Sandbox();

    it('return traditional function', () => {
        const fn = sandbox.evaluate('(function(){})');
        expect(fn).toBeInstanceOf(Function);
    });

    it('return arrow function', () => {
        const fn = sandbox.evaluate('() => {}');
        expect(fn).toBeInstanceOf(Function);
    });

    it('return async function', async () => {
        const fn = sandbox.evaluate('async () => 123');
        expect(fn).toBeInstanceOf(Function);
        const result = fn();
        expect(result).toBeInstanceOf(Promise);
        expect(await result).toBe(123);
    });

    it('wrapped function returns primitive data', () => {
        let fn = sandbox.evaluate('() => 123');
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

    it('wrapped function returns function', async () => {
        const fn = sandbox.evaluate('() => ()=>{}');
        expect(fn()).toBeInstanceOf(Function);
    });

    it('wrapped function returns ArrayBuffer', () => {
        const result = sandbox.evaluate('() => new ArrayBuffer(8)')();
        expect(result).toBeInstanceOf(ArrayBuffer);
        expect(result.byteLength).toBe(8);
    });

    it('wrapped function returns DataView', () => {
        const result = sandbox.evaluate(
            `() => new DataView(new ArrayBuffer(8))`
        )();
        expect(result).toBeInstanceOf(DataView);
        expect(result.byteLength).toBe(8);
    });

    it('wrapped function returns TypedArray', () => {
        const result = sandbox.evaluate('() => new Uint8Array(8)')();
        expect(result).toBeInstanceOf(Uint8Array);
        expect(result.byteLength).toBe(8);
    });

    it('wrapped function returns plain object', () => {
        const result = sandbox.evaluate('() => ({ a: 123 })')();
        expect(result).toBeInstanceOf(Object);
        expect(result.a).toBe(123);
    });

    it('wrapped function returns unstructured data', () => {
        expect(() => {
            sandbox.evaluate('() => globalThis')();
        }).toThrowError(Error);
    });

    it('wrapped function throws error', () => {
        try {
            sandbox.evaluate('() => { throw new Error("hello") }')();
        } catch (error) {
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toBe('hello');
            return;
        }
        throw 'never';
    });

    it('wrapped function throws custom error', () => {
        try {
            const fn = sandbox.evaluate(`
                class CustomError extends Error {};
                () => { throw new CustomError("hello") };
            `);
            fn();
        } catch (error) {
            expect(error).toBeInstanceOf(Error);
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
                sandbox.evaluate(`() => { throw ${source} }`)();
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

    it('wrapped function returns Promise<Primitive>', async () => {
        const result = sandbox.evaluate('() => Promise.resolve(123)')();
        expect(result).toBeInstanceOf(Promise);
        expect(await result).toBe(123);
    });

    it('wrapped function returns Promise<ArrayBuffer>', async () => {
        const result = sandbox.evaluate(
            '() => Promise.resolve(new ArrayBuffer(8))'
        )();
        expect(result).toBeInstanceOf(Promise);
        expect(await result).toBeInstanceOf(ArrayBuffer);
    });

    it('wrapped function returns Promise<DataView>', async () => {
        const result = sandbox.evaluate(
            `() => Promise.resolve(new DataView(new ArrayBuffer(8)))`
        )();
        expect(result).toBeInstanceOf(Promise);
        expect(await result).toBeInstanceOf(DataView);
    });

    it('wrapped function returns Promise<TypedArray>', async () => {
        const result = sandbox.evaluate(
            '() => Promise.resolve(new Uint8Array(8))'
        )();
        expect(result).toBeInstanceOf(Promise);
        expect(await result).toBeInstanceOf(Uint8Array);
    });

    it('wrapped function returns Promise<PlainObject>', async () => {
        const result = sandbox.evaluate('() => Promise.resolve({})')();
        expect(result).toBeInstanceOf(Promise);
        expect(await result).toBeInstanceOf(Object);
    });

    it('wrapped function returns Promise<Unstructured>', async () => {
        const result = sandbox.evaluate('() => Promise.resolve(globalThis)')();
        expect(result).toBeInstanceOf(Promise);
        try {
            await result;
        } catch (error) {
            expect(error).toBeInstanceOf(Error);
            return;
        }
        throw 'never';
    });

    it('wrapped function returns rejected promise', async () => {
        const result = sandbox.evaluate(
            '() => Promise.reject(new Error("hello"))'
        )();
        expect(result).toBeInstanceOf(Promise);
        try {
            await result;
        } catch (error) {
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toBe('hello');
            return;
        }
        throw 'never';
    });

    it('pass primitive data to wrapped function', () => {
        const fn = sandbox.evaluate(`v => typeof v`);
        expect(fn(1)).toBe('number');
        expect(fn(1n)).toBe('bigint');
        expect(fn(true)).toBe('boolean');
        expect(fn('')).toBe('string');
        expect(fn(null)).toBe('object');
        expect(fn()).toBe('undefined');
        expect(fn(Symbol())).toBe('symbol');
    });

    it('pass ArrayBuffer to wrapped function', () => {
        const fn = sandbox.evaluate(`v => v instanceof ArrayBuffer`);
        const result = fn(new ArrayBuffer(8));
        expect(result).toBeTruthy();
    });

    it('pass DataView to wrapped function', () => {
        const fn = sandbox.evaluate(`v => v instanceof DataView`);
        const result = fn(new DataView(new ArrayBuffer(8)));
        expect(result).toBeTruthy();
    });

    it('pass TypedArray to wrapped function', () => {
        const fn = sandbox.evaluate(`v => v instanceof Uint8Array`);
        const result = fn(new Uint8Array(8));
        expect(result).toBeTruthy();
    });

    it('pass plain object to wrapped function', () => {
        const fn = sandbox.evaluate(`v => v instanceof Object`);
        const result = fn({});
        expect(result).toBeTruthy();
    });

    it('pass unstructured data to wrapped function', () => {
        const fn = sandbox.evaluate(`() => {}`);
        try {
            fn(globalThis);
        } catch (error) {
            expect(error).toBeInstanceOf(DOMException);
            return;
        }
        throw 'never';
    });

    it('pass Promise<Primitive> to wrapped function', async () => {
        const fn = sandbox.evaluate(`
            async (v) => {
                if (v instanceof Promise) return (await v) + 1;
            }
        `);
        const result = fn(Promise.resolve(1));
        expect(await result).toBe(2);
    });
});

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

    it('inner function returns primitive data', () => {
        const exec = (code) => sandbox.evaluate(`() => ${code}`)();
        expect(exec('123')).toBe(123);
        expect(exec('123n')).toBe(123n);
        expect(exec('"hello"')).toBe('hello');
        expect(exec('true')).toBe(true);
        expect(exec('null')).toBeNull();
        expect(exec('undefined')).toBeUndefined();
        const result = exec('Symbol("hello")');
        expect(typeof result).toBe('symbol');
        expect(result.toString()).toBe('Symbol(hello)');
    });

    it('inner function returns function', () => {
        const fn = sandbox.evaluate('() => ()=>123')();
        expect(fn).toBeInstanceOf(Function);
        expect(fn()).toBe(123);
    });

    it('inner function returns ArrayBuffer', () => {
        const result = sandbox.evaluate('() => new ArrayBuffer(8)')();
        expect(result).toBeInstanceOf(ArrayBuffer);
        expect(result.byteLength).toBe(8);
    });

    it('inner function returns DataView', () => {
        const result = sandbox.evaluate(
            `() => new DataView(new ArrayBuffer(8))`
        )();
        expect(result).toBeInstanceOf(DataView);
        expect(result.byteLength).toBe(8);
    });

    it('inner function returns TypedArray', () => {
        const result = sandbox.evaluate('() => new Uint8Array(8)')();
        expect(result).toBeInstanceOf(Uint8Array);
        expect(result.byteLength).toBe(8);
    });

    it('inner function returns plain object', () => {
        const result = sandbox.evaluate('() => ({ a: 123 })')();
        expect(result).toBeInstanceOf(Object);
        expect(result.a).toBe(123);
    });

    it('inner function returns unstructured data', () => {
        expect(() => {
            sandbox.evaluate('() => globalThis')();
        }).toThrowError(Error);
    });

    it('inner function throws error', () => {
        try {
            sandbox.evaluate('() => { throw new Error("hello") }')();
        } catch (error) {
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toBe('hello');
            return;
        }
        throw 'never';
    });

    it('inner function throws custom error', () => {
        try {
            sandbox.evaluate(`
                class CustomError extends Error {};
                () => { throw new CustomError("hello") };
            `)();
        } catch (error) {
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toBe('hello');
            return;
        }
        throw 'never';
    });

    it('inner function throws primitive data', () => {
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

    it('inner function returns Promise<Primitive>', async () => {
        const result = sandbox.evaluate('() => Promise.resolve(123)')();
        expect(result).toBeInstanceOf(Promise);
        expect(await result).toBe(123);
    });

    it('inner function returns Promise<ArrayBuffer>', async () => {
        const result = sandbox.evaluate(
            '() => Promise.resolve(new ArrayBuffer(8))'
        )();
        expect(result).toBeInstanceOf(Promise);
        expect(await result).toBeInstanceOf(ArrayBuffer);
    });

    it('inner function returns Promise<DataView>', async () => {
        const result = sandbox.evaluate(
            `() => Promise.resolve(new DataView(new ArrayBuffer(8)))`
        )();
        expect(result).toBeInstanceOf(Promise);
        expect(await result).toBeInstanceOf(DataView);
    });

    it('inner function returns Promise<TypedArray>', async () => {
        const result = sandbox.evaluate(
            '() => Promise.resolve(new Uint8Array(8))'
        )();
        expect(result).toBeInstanceOf(Promise);
        expect(await result).toBeInstanceOf(Uint8Array);
    });

    it('inner function returns Promise<PlainObject>', async () => {
        const result = sandbox.evaluate('() => Promise.resolve({})')();
        expect(result).toBeInstanceOf(Promise);
        expect(await result).toBeInstanceOf(Object);
    });

    it('inner function returns Promise<Unstructured>', async () => {
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

    it('inner function returns rejected promise', async () => {
        const result = sandbox.evaluate('() => Promise.reject(1)')();
        expect(result).toBeInstanceOf(Promise);
        try {
            await result;
        } catch (error) {
            expect(error).toBe(1);
            return;
        }
        throw 'never';
    });

    it('pass primitive data to inner function', () => {
        const check = sandbox.evaluate(`(v, type) => typeof v === type`);
        expect(check(1, 'number')).toBeTruthy();
        expect(check(1n, 'bigint')).toBeTruthy();
        expect(check(true, 'boolean')).toBeTruthy();
        expect(check('', 'string')).toBeTruthy();
        expect(check(null, 'object')).toBeTruthy();
        expect(check(undefined, 'undefined')).toBeTruthy();
        expect(check(Symbol(), 'symbol')).toBeTruthy();
    });

    it('pass ArrayBuffer to inner function', () => {
        const fn = sandbox.evaluate(`v => v instanceof ArrayBuffer`);
        const result = fn(new ArrayBuffer(8));
        expect(result).toBeTruthy();
    });

    it('pass DataView to inner function', () => {
        const fn = sandbox.evaluate(`v => v instanceof DataView`);
        const result = fn(new DataView(new ArrayBuffer(8)));
        expect(result).toBeTruthy();
    });

    it('pass TypedArray to inner function', () => {
        const fn = sandbox.evaluate(`v => v instanceof Uint8Array`);
        const result = fn(new Uint8Array(8));
        expect(result).toBeTruthy();
    });

    it('pass plain object to inner function', () => {
        const fn = sandbox.evaluate(`v => v instanceof Object`);
        const result = fn({});
        expect(result).toBeTruthy();
    });

    it('pass unstructured data to inner function', () => {
        const fn = sandbox.evaluate(`() => {}`);
        try {
            fn(globalThis);
        } catch (error) {
            expect(error).toBeInstanceOf(DOMException);
            return;
        }
        throw 'never';
    });

    it('pass Promise<Primitive> to inner function', async () => {
        const fn = sandbox.evaluate(`
            async (v) => {
                if (v instanceof Promise) return (await v) + 1;
            }
        `);
        const result = fn(Promise.resolve(1));
        expect(await result).toBe(2);
    });

    it('pass Promise<ArrayBuffer> to inner function', async () => {
        const fn = sandbox.evaluate(
            ` async (v) => (await v) instanceof ArrayBuffer`
        );
        const result = fn(Promise.resolve(new ArrayBuffer(8)));
        expect(await result).toBeTruthy();
    });

    it('pass Promise<DataView> to inner function', async () => {
        const fn = sandbox.evaluate(
            ` async (v) => (await v) instanceof DataView`
        );
        const result = fn(Promise.resolve(new DataView(new ArrayBuffer(8))));
        expect(await result).toBeTruthy();
    });

    it('pass Promise<TypedArray> to inner function', async () => {
        const fn = sandbox.evaluate(
            ` async (v) => (await v) instanceof Uint8Array`
        );
        const result = fn(Promise.resolve(new Uint8Array(8)));
        expect(await result).toBeTruthy();
    });

    it('pass Promise<PlainObject> to inner function', async () => {
        const fn = sandbox.evaluate(
            ` async (v) => (await v) instanceof Object`
        );
        const result = fn(Promise.resolve({}));
        expect(await result).toBeTruthy();
    });

    it('pass Promise<Unstructured> to inner function', async () => {
        const fn = sandbox.evaluate(`
            async (v) => {
                try {
                    await v;
                } catch (error) {
                    return error instanceof DOMException;
                }
            }
        `);
        const result = await fn(Promise.resolve(globalThis));
        expect(result).toBeTruthy();
    });

    it('pass rejected promise to inner function', async () => {
        const fn = sandbox.evaluate(`
            async (v) => {
                try {
                    await v;
                } catch (error) {
                    return error === 123;
                }
            }
        `);
        const result = await fn(Promise.reject(123));
        expect(await result).toBeTruthy();
    });

    it('pass outer function to inner function', () => {
        const inner = sandbox.evaluate(`outer => outer instanceof Function`);
        expect(inner(() => {})).toBeTruthy();
    });

    it('outer function throws error', () => {
        const inner = sandbox.evaluate(`
            (outer) => {
                try {
                    outer();
                } catch(e) {
                    return e instanceof Error && e.message === 'hello'
                }
            }
        `);
        const outer = () => {
            throw new Error('hello');
        };
        expect(inner(outer)).toBeTruthy();
    });

    it('outer function returns TypedArray', () => {
        const inner = sandbox.evaluate(
            `(outer) => outer() instanceof Uint8Array`
        );
        const outer = () => new Uint8Array(8);
        expect(inner(outer)).toBeTruthy();
    });

    it('outer function returns Promise<ArrayBuffer>', async () => {
        const inner = sandbox.evaluate(`
            async (outer) => {
                const result = outer();
                return (
                    result instanceof Promise &&
                    (await result) instanceof ArrayBuffer
                );
            };
        `);
        const outer = () => Promise.resolve(new ArrayBuffer(8));
        expect(await inner(outer)).toBeTruthy();
    });

    it('outer function returns function', () => {
        const inner = sandbox.evaluate(
            `(outer) => outer() instanceof Function`
        );
        const outer = () => () => {};
        expect(inner(outer)).toBeTruthy();
    });
});

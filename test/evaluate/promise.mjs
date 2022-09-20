describe('Method "evaluate" returns Promise', () => {
    const sandbox = new Sandbox();

    it('Promise<Primitive>', async () => {
        const resolve = (code) => sandbox.evaluate(`Promise.resolve(${code})`);
        const result = resolve('Symbol()');
        expect(result).toBeInstanceOf(Promise);
        expect(typeof (await result)).toBe('symbol');
        expect(await resolve('123')).toBe(123);
        expect(await resolve('123n')).toBe(123n);
        expect(await resolve('true')).toBe(true);
        expect(await resolve('')).toBe(undefined);
        expect(await resolve('"hello"')).toBe('hello');
        expect(await resolve('null')).toBe(null);
    });

    it('Promise<ArrayBuffer>', async () => {
        const result = sandbox.evaluate('Promise.resolve(new ArrayBuffer(8))');
        expect(result).toBeInstanceOf(Promise);
        expect(await result).toBeInstanceOf(ArrayBuffer);
    });

    it('Promise<DataView>', async () => {
        const result = sandbox.evaluate(
            `Promise.resolve(new DataView(new ArrayBuffer(8)))`
        );
        expect(result).toBeInstanceOf(Promise);
        expect(await result).toBeInstanceOf(DataView);
    });

    it('Promise<TypedArray>', async () => {
        const result = sandbox.evaluate('Promise.resolve(new Uint8Array(8))');
        expect(result).toBeInstanceOf(Promise);
        expect(await result).toBeInstanceOf(Uint8Array);
    });

    it('Promise<PlainObject>', async () => {
        const result = sandbox.evaluate('Promise.resolve({})');
        expect(result).toBeInstanceOf(Promise);
        expect(await result).toBeInstanceOf(Object);
    });

    it('Promise<Unstructured>', async () => {
        const result = sandbox.evaluate('Promise.resolve(globalThis)');
        expect(result).toBeInstanceOf(Promise);
        try {
            await result;
        } catch (error) {
            expect(error).toBeInstanceOf(Error);
            return;
        }
        throw 'never';
    });

    it('rejected promise', async () => {
        const result = sandbox.evaluate('Promise.reject(123)');
        expect(result).toBeInstanceOf(Promise);
        try {
            await result;
        } catch (error) {
            expect(error).toBe(123);
            return;
        }
        throw 'never';
    });
});

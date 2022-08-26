describe('Method "evaluate" returns structured data', () => {
    const sandbox = new Sandbox();

    it('ArrayBuffer', () => {
        const result = sandbox.evaluate('globalThis.$ = new ArrayBuffer(8)');
        expect(result).toBeInstanceOf(ArrayBuffer);
        expect(result.byteLength).toBe(8);
        expect(sandbox.evaluate('globalThis.$.byteLength')).toBe(0);
        sandbox.evaluate('delete globalThis.$');
    });

    // it('MessageChannel', () => {
    //     const result = sandbox.evaluate(`
    //         globalThis.$ = new MessageChannel();
    //         globalThis.$.port2;
    //     `);
    //     expect(result instanceof MessagePort).toBe(true);
    //     sandbox.evaluate('delete globalThis.$');
    // });

    it('ReadableStream', () => {
        const result = sandbox.evaluate('new ReadableStream()');
        expect(result).toBeInstanceOf(ReadableStream);
    });

    it('WritableStream', () => {
        const result = sandbox.evaluate('new WritableStream()');
        expect(result).toBeInstanceOf(WritableStream);
    });

    it('TransformStream', () => {
        const result = sandbox.evaluate('new TransformStream()');
        expect(result).toBeInstanceOf(TransformStream);
    });

    // it('AudioData', () => {
    //     if (!globalThis.AudioData) {
    //         return;
    //     }
    //     const result = sandbox.evaluate(
    //         'globalThis.$ = new AudioData({ format: "u8" })'
    //     );
    //     expect(result instanceof AudioData).toBe(true);
    //     sandbox.evaluate('delete globalThis.$');
    // });

    it('DataView', () => {
        const result = sandbox.evaluate(`
            globalThis.$ = new DataView(new ArrayBuffer(8));
        `);
        expect(result).toBeInstanceOf(DataView);
        expect(result.byteLength).toBe(8);
        expect(sandbox.evaluate('globalThis.$.buffer.byteLength')).toBe(0);
        sandbox.evaluate('delete globalThis.$');
    });

    it('TypedArray', () => {
        const result = sandbox.evaluate('globalThis.$ = new Uint8Array(8)');
        expect(result).toBeInstanceOf(Uint8Array);
        expect(result.byteLength).toBe(8);
        expect(sandbox.evaluate('globalThis.$.byteLength')).toBe(0);
        sandbox.evaluate('delete globalThis.$');
    });

    it('plain object', () => {
        const result = sandbox.evaluate('({ a: 123 })');
        expect(result).toBeInstanceOf(Object);
        expect(result.a).toBe(123);
    });

    it('unstructured data', () => {
        expect(() => {
            sandbox.evaluate('globalThis');
        }).toThrowError(Error);
    });
});

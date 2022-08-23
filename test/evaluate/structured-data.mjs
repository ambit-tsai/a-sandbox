describe('Method "evaluate" allows structured data', () => {
    const sandbox = new Sandbox();

    it('return ArrayBuffer', () => {
        const result = sandbox.evaluate('globalThis.$ = new ArrayBuffer(8)');
        expect(result instanceof ArrayBuffer).toBe(true);
        expect(result.byteLength).toBe(8);
        expect(sandbox.evaluate('globalThis.$.byteLength')).toBe(0);
        sandbox.evaluate('delete globalThis.$');
    });

    // it('return MessageChannel', () => {
    //     const result = sandbox.evaluate(`
    //         globalThis.$ = new MessageChannel();
    //         globalThis.$.port2;
    //     `);
    //     expect(result instanceof MessagePort).toBe(true);
    //     sandbox.evaluate('delete globalThis.$');
    // });

    it('return ReadableStream', () => {
        const result = sandbox.evaluate('globalThis.$ = new ReadableStream()');
        expect(result instanceof ReadableStream).toBe(true);
        sandbox.evaluate('delete globalThis.$');
    });

    it('return WritableStream', () => {
        const result = sandbox.evaluate('globalThis.$ = new WritableStream()');
        expect(result instanceof WritableStream).toBe(true);
        sandbox.evaluate('delete globalThis.$');
    });

    it('return TransformStream', () => {
        const result = sandbox.evaluate('globalThis.$ = new TransformStream()');
        expect(result instanceof TransformStream).toBe(true);
        sandbox.evaluate('delete globalThis.$');
    });

    // it('return AudioData', () => {
    //     if (!globalThis.AudioData) {
    //         return;
    //     }
    //     const result = sandbox.evaluate(
    //         'globalThis.$ = new AudioData({ format: "u8" })'
    //     );
    //     expect(result instanceof AudioData).toBe(true);
    //     sandbox.evaluate('delete globalThis.$');
    // });

    it('return DataView', () => {
        const result = sandbox.evaluate(`
            const buffer = new ArrayBuffer(8);
            globalThis.$ = new DataView(buffer);
        `);
        expect(result instanceof DataView).toBe(true);
        expect(result.byteLength).toBe(8);
        expect(sandbox.evaluate('globalThis.$.buffer.byteLength')).toBe(0);
        sandbox.evaluate('delete globalThis.$');
    });

    it('return TypedArray', () => {
        const result = sandbox.evaluate('globalThis.$ = new Uint8Array(8)');
        expect(result instanceof Uint8Array).toBe(true);
        expect(result.byteLength).toBe(8);
        expect(sandbox.evaluate('globalThis.$.byteLength')).toBe(0);
        sandbox.evaluate('delete globalThis.$');
    });

    it('return plain object', () => {
        const result = sandbox.evaluate('({ a: 123 })');
        expect(result instanceof Object).toBe(true);
        expect(result.a).toBe(123);
    });
});

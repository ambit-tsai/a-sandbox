describe('Class "Sandbox"', () => {
    it('constructor', () => {
        expect(typeof Sandbox).toBe('function');
        expect(Sandbox.prototype).toBeInstanceOf(Object);
        expect(typeof Sandbox.prototype.evaluate).toBe('function');
        expect(typeof Sandbox.prototype.importValue).toBe('function');
    });

    it('new', () => {
        const sandbox = new Sandbox();
        expect(sandbox).toBeInstanceOf(Object);
        const desc = Object.getOwnPropertyDescriptor(sandbox, '_getRealm');
        expect(desc).toBeInstanceOf(Object);
        expect(desc.configurable).toBeFalsy();
        expect(desc.enumerable).toBeFalsy();
        expect(desc.writable).toBeFalsy();
        expect(typeof desc.value).toBe('function');
        expect(sandbox._getRealm()).toBeUndefined();
    });
});

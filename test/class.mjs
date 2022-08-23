describe('Class "Sandbox"', () => {
    it('constructor', () => {
        expect(typeof Sandbox).toBe('function');
        expect(Sandbox.prototype instanceof Object).toBe(true);
        expect(typeof Sandbox.prototype.evaluate).toBe('function');
        expect(typeof Sandbox.prototype.importValue).toBe('function');
    });

    it('new', () => {
        const sandbox = new Sandbox();
        expect(sandbox instanceof Object).toBe(true);
        const desc = Object.getOwnPropertyDescriptor(sandbox, '_getRealm');
        expect(desc instanceof Object).toBe(true);
        expect(desc.configurable).toBe(false);
        expect(desc.enumerable).toBe(false);
        expect(desc.writable).toBe(false);
        expect(typeof desc.value).toBe('function');
        expect(sandbox._getRealm()).toBeUndefined();
    });
});

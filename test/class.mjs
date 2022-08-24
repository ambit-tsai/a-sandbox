describe('Class "Sandbox"', () => {
    const sandbox = new Sandbox();

    it('constructor', () => {
        expect(typeof Sandbox).toBe('function');
        expect(Sandbox.prototype instanceof Object).toBeTruthy();
        expect(typeof Sandbox.prototype.evaluate).toBe('function');
        expect(typeof Sandbox.prototype.importValue).toBe('function');
    });

    it('new', () => {
        expect(sandbox instanceof Object).toBeTruthy();
        const desc = Object.getOwnPropertyDescriptor(sandbox, '_getRealm');
        expect(desc instanceof Object).toBeTruthy();
        expect(desc.configurable).toBe(false);
        expect(desc.enumerable).toBe(false);
        expect(desc.writable).toBe(false);
        expect(typeof desc.value).toBe('function');
        expect(sandbox._getRealm()).toBeUndefined();
    });

    it('global object inside sandbox ', () => {
        const result = sandbox.evaluate(`
            const descMap = Object.getOwnPropertyDescriptors(globalThis);
            const list = [];
            for (const [key, desc] of Object.entries(descMap)) {
                if (
                    !(desc instanceof Object) ||
                    (desc.get && !(desc.get instanceof Object)) ||
                    (desc.set && !(desc.set instanceof Object)) ||
                    (desc.value &&
                        (typeof desc.value === 'object' ||
                            typeof desc.value === 'function') &&
                        !(desc.value instanceof Object))
                ) {
                    list.push(key);
                }
            }
            list.join('');
        `);
        expect(result).toBe('');
    });
});

import { createRealm, Realm } from './realm';
import { define, getWrappedValue, PRIVATE_KEY, wrapError } from './helpers';

export class Sandbox {
    // @ts-ignore
    _getRealm: (key: unknown) => Realm;

    constructor(options: Record<string, any>) {
        const realm = createRealm();
        define(this, '_getRealm', {
            configurable: false,
            writable: false,
            value(key: unknown) {
                if (key === PRIVATE_KEY) return realm;
            },
        });
    }

    /**
     * Eval code in sandbox.
     * @return primitive, callable or structured data
     */
    evaluate<T>(sourceText: string): T {
        if (typeof sourceText !== 'string') {
            throw new TypeError('evaluate expects a string');
        }
        const realm = this._getRealm(PRIVATE_KEY);
        try {
            const result = realm.globalObject.eval(sourceText);
            return getWrappedValue(result, realm);
        } catch (error) {
            throw wrapError(error, realm);
        }
    }

    importValue(code: string) {
        const realm = this._getRealm(PRIVATE_KEY);
    }
}

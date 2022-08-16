import { createRealm, Realm } from './realm';
import { getWrappedValue, wrapError } from './helpers';

const KEY = {};

export class Sandbox {
    // @ts-ignore
    _getRealm: (key: unknown) => Realm;

    constructor(options: Record<string, any>) {
        const realm = createRealm();
        Object.defineProperty(this, '_getRealm', {
            configurable: false,
            writable: false,
            value(key: unknown) {
                if (key === KEY) return realm;
            },
        });
    }

    /**
     * Return value must be Primitive | Callable | Promise<Primitive | Callable>
     */
    evaluate(sourceText: string) {
        if (typeof sourceText !== 'string') {
            throw new TypeError('evaluate expects a string');
        }
        const realm = this._getRealm(KEY);
        try {
            const result = realm.globalObject.eval(sourceText);
            return getWrappedValue(result, realm);
        } catch (error) {
            throw wrapError(error, realm);
        }
    }

    importValue(code: string) {
        const realm = this._getRealm(KEY);
    }
}

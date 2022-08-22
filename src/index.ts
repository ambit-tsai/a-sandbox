import { createRealm, Realm } from './realm';
import {
    define,
    getWrappedValue,
    Global,
    PRIVATE_KEY,
    wrapError,
} from './helpers';

export class Sandbox {
    // @ts-ignore
    _getRealm: (key: unknown) => Realm;

    constructor(options: Record<string, any>) {
        const realm = createRealm();
        define(this, '_getRealm', {
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
        const outerRealm = {
            intrinsics: Global,
        } as Realm;
        try {
            const result = realm.globalObject.eval(sourceText);
            return getWrappedValue(result, realm, outerRealm);
        } catch (error) {
            throw wrapError(error, realm, outerRealm);
        }
    }

    importValue(code: string) {
        const realm = this._getRealm(PRIVATE_KEY);
    }
}

import { createRealm, Realm } from './realm';
import {
    define,
    getWrappedValue,
    Global,
    PRIVATE_KEY,
    wrapError,
} from './helpers';

interface Private {
    innerRealm: Realm;
    outerRealm: Realm;
    options: { onInit: (realm: Realm) => void };
}

export default class Sandbox {
    // @ts-ignore
    _getPrivate: (key: unknown) => Private;

    constructor(options = {} as Private['options']) {
        const innerRealm = createRealm();
        const $private: Private = {
            innerRealm,
            outerRealm: {
                intrinsics: Global,
                TypedArray: Object.getPrototypeOf(Int8Array),
                str2json: JSON.parse,
                json2str: JSON.stringify,
            } as Realm,
            options,
        };
        define(this, '_getPrivate', {
            value(key: unknown) {
                if (key === PRIVATE_KEY) return $private;
            },
        });
        options.onInit?.(innerRealm);
    }

    /**
     * Eval code in sandbox.
     * @return primitive, callable or structured data
     */
    evaluate(sourceText: string): any {
        if (typeof sourceText !== 'string') {
            throw new TypeError('"evaluate" expects a string');
        }
        const { innerRealm, outerRealm } = this._getPrivate(PRIVATE_KEY);
        try {
            const result = innerRealm.globalObject.eval(sourceText);
            return getWrappedValue(result, innerRealm, outerRealm);
        } catch (error) {
            throw wrapError(error, innerRealm, outerRealm);
        }
    }

    /**
     * Run function within sandbox
     */
    evaluateHandle(func: (this: undefined) => any): any {
        if (typeof func !== 'function') {
            throw new TypeError('"evaluateHandle" expects a function');
        }
        return this.evaluate('(' + func.toString() + ')()');
    }
}

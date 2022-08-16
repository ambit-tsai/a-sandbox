import { createRealm, Realm } from './realm';
import { getWrappedValue, wrapError } from './helpers';

export class Sandbox {
    _realm: Realm;

    constructor(options: Record<string, any>) {
        this._realm = createRealm();
    }

    /**
     * Return value must be Primitive | Callable | Promise<Primitive | Callable>
     */
    evaluate(sourceText: string) {
        if (typeof sourceText !== 'string') {
            throw new TypeError('evaluate expects a string');
        }
        try {
            const result = this._realm.globalObject.eval(sourceText);
            return getWrappedValue(result, this._realm);
        } catch (error) {
            throw wrapError(error, this._realm);
        }
    }

    importValue(code: string) {
        //
    }
}

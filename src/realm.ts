import * as utils from './helpers';
import { GlobalObject } from './helpers';

const codeOfCreateRealm = '(' + createRealmInContext.toString() + ')';

export function createRealm() {
    const iframe = document.createElement('iframe');
    document.head.appendChild(iframe);
    const realm = (iframe.contentWindow as GlobalObject).eval(
        codeOfCreateRealm
    )(utils);
    document.head.removeChild(iframe);
    return realm;
}

type Utils = typeof utils;

export interface Realm {
    intrinsics: GlobalObject;
    globalObject: GlobalObject;
    evalInContext: Function;
}

function createRealmInContext(utils: Utils) {
    const win = window as GlobalObject;
    const { Error, EventTarget, Function: RawFunction, Object, Symbol } = win;
    const { getOwnPropertyNames } = Object;
    const intrinsics = {} as GlobalObject;
    const globalObject = {} as GlobalObject;
    const evalInContext = RawFunction('with(this)return eval(arguments[0])');
    let UNDEFINED: undefined;
    const {
        apply,
        define,
        dynamicImportPattern,
        dynamicImportReplacer,
        replace,
    } = utils;

    const realm: Realm = {
        intrinsics,
        globalObject,
        evalInContext,
    };

    if (Symbol && Symbol.unscopables) {
        // Prevent escape from the `with` context
        define(globalObject, Symbol.unscopables, {
            value: Object.seal(Object.create(null)),
        });
    }

    // Handle global object
    for (const key of getOwnPropertyNames(win) as any[]) {
        intrinsics[key] = win[key];
        const isReserved = utils.globalReservedProps.indexOf(key) !== -1;
        const descriptor = Object.getOwnPropertyDescriptor(win, key)!;
        if (key === 'window') {
            define(globalObject, key, {
                enumerable: true,
                value: globalObject,
            });
        } else if (isReserved) {
            define(globalObject, key, descriptor); // copy to new global object
        }
        if (descriptor.configurable) {
            delete win[key];
        } else if (descriptor.writable) {
            win[key] = UNDEFINED as any;
        } else if (!isReserved) {
            // Intercept properties that cannot be deleted
            define(globalObject, key, { value: UNDEFINED });
        }
    }

    if (EventTarget) {
        // Intercept the props of EventTarget.prototype
        for (const key of getOwnPropertyNames(EventTarget.prototype)) {
            define(win, key, { value: UNDEFINED });
        }
    }

    defineSafeEval();
    globalObject.Function = createSafeFunction();
    globalObject.globalThis = globalObject;

    return realm;

    function defineSafeEval() {
        let isInnerCall = false;
        const safeEval = createSafeEval();
        define(globalObject, 'eval', {
            configurable: false,
            get() {
                if (isInnerCall) {
                    isInnerCall = false;
                    return intrinsics.eval; // return raw `eval`
                }
                return safeEval;
            },
            set(val) {
                isInnerCall = val === utils.PRIVATE_KEY;
            },
        });
    }

    function createSafeEval() {
        return {
            eval(x: string) {
                // `'use strict'` is used to enable strict mode
                // `undefined`  is used to ensure that the return value remains unchanged
                x =
                    '"use strict";undefined;' +
                    replace(x, dynamicImportPattern, dynamicImportReplacer);
                // @ts-ignore: to use raw `eval`
                globalObject.eval = utils.PRIVATE_KEY;
                return apply(evalInContext, globalObject, [x]);
            },
        }.eval; // fix TS1215: Invalid use of 'eval'
    }

    function createSafeFunction(): FunctionConstructor {
        const { toString } = RawFunction;
        const Ctor = function Function() {
            const rawFn = apply(RawFunction, UNDEFINED, arguments);
            let fnStr = apply(toString, rawFn, []);
            fnStr = replace(fnStr, dynamicImportPattern, dynamicImportReplacer);
            fnStr =
                'with(this)return function(){"use strict";return ' +
                fnStr +
                '}()';
            const wrapFn = RawFunction(fnStr);
            const safeFn: Function = apply(wrapFn, globalObject, []);
            return function (this: any) {
                const ctx = this === win ? UNDEFINED : this;
                return apply(safeFn, ctx, arguments);
            };
        };
        Ctor.prototype = RawFunction.prototype;
        Ctor.prototype.constructor = Ctor;
        return Ctor as any;
    }
}

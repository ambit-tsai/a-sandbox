import * as utils from './helpers';
import { GlobalObject } from './helpers';

const codeOfCreateRealm = '(' + createRealmInContext.toString() + ')';

export function createRealm(): Realm {
    const iframe = document.createElement('iframe');
    document.head.appendChild(iframe);
    const realm = (iframe.contentWindow as GlobalObject).eval(
        codeOfCreateRealm
    )(utils);
    // document.head.removeChild(iframe);
    return realm;
}

type Utils = typeof utils;

export interface Realm {
    intrinsics: GlobalObject;
    globalObject: GlobalObject;
    TypedArray: Int8Array;
    str2json: typeof JSON.parse;
    json2str: typeof JSON.stringify;
}

function createRealmInContext(utils: Utils) {
    const win = window as GlobalObject;
    const {
        EventTarget,
        Function: RawFunction,
        Int8Array,
        Object,
        String: {
            prototype: { replace },
        },
        SyntaxError,
        Symbol,
        JSON,
    } = win;
    const { getOwnPropertyNames } = Object;
    const { apply, define } = utils;
    const intrinsics = {} as GlobalObject;
    const globalObject = {} as GlobalObject;
    const TRUE = true;
    let UNDEFINED: undefined;

    /**
     * Syntax: import("module-name") => __import("module-name")
     */
    const dynamicImportPattern = /(^|[^.$])(\bimport\s*(\(|\/[/*]))/g;
    const dynamicImportReplacer = '$1__$2';

    const replaceMap: Record<string, Function> = {
        globalThis: () => ({
            configurable: TRUE,
            writable: TRUE,
            value: globalObject,
        }),
        window: () => ({
            enumerable: TRUE,
            value: globalObject,
        }),
        Function: getSafeFunction,
        clearInterval: () => ({
            configurable: TRUE,
            enumerable: TRUE,
            writable: TRUE,
            value(id: number) {
                apply(intrinsics.clearInterval, UNDEFINED, [id]);
            },
        }),
        clearTimeout: () => ({
            configurable: TRUE,
            enumerable: TRUE,
            writable: TRUE,
            value(id: number) {
                apply(intrinsics.clearTimeout, UNDEFINED, [id]);
            },
        }),
        setInterval: getDelayFunc('setInterval'),
        setTimeout: getDelayFunc('setTimeout'),
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
        if (isReserved) {
            let desc = descriptor;
            if (replaceMap[key]) {
                desc = replaceMap[key]();
            } else if (desc.get) {
                desc.value = win[key];
                delete desc.get;
                delete desc.set;
            }
            define(globalObject, key, desc); // copy to new global object
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

    define(globalObject, '__import', {
        value() {
            throw new SyntaxError('not support dynamic import');
        },
    });
    defineSafeEval();

    return {
        intrinsics,
        globalObject,
        TypedArray: Object.getPrototypeOf(Int8Array),
        str2json: JSON.parse,
        json2str: JSON.stringify,
    };

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
                isInnerCall = val === intrinsics;
            },
        });
    }

    function createSafeEval() {
        const evalInContext = RawFunction(
            'with(this)return eval(arguments[0])'
        );
        return {
            eval(x: string) {
                // `'use strict'` is used to enable strict mode
                // `undefined` is used to ensure that the return value remains unchanged
                x = apply(replace, '"use strict";undefined;' + x, [
                    dynamicImportPattern,
                    dynamicImportReplacer,
                ]);
                // @ts-ignore: `intrinsics` is the key to use raw `eval`
                globalObject.eval = intrinsics;
                return apply(evalInContext, globalObject, [x]);
            },
        }.eval; // fix TS1215: Invalid use of 'eval'
    }

    function getSafeFunction() {
        const { toString } = RawFunction;
        const Ctor = function Function() {
            const rawFn = apply(RawFunction, UNDEFINED, arguments);
            let fnStr = apply(toString, rawFn, []);
            fnStr = apply(replace, fnStr, [
                dynamicImportPattern,
                dynamicImportReplacer,
            ]);
            fnStr =
                'with(this)return function(){"use strict";return ' +
                fnStr +
                '}()';
            const wrapFn = RawFunction(fnStr);
            const safeFn: Function = apply(wrapFn, globalObject, []);
            return function (this: unknown) {
                const ctx = this === win ? UNDEFINED : this;
                return apply(safeFn, ctx, arguments);
            };
        };
        Ctor.prototype = RawFunction.prototype;
        Ctor.prototype.constructor = Ctor;
        return {
            configurable: TRUE,
            writable: TRUE,
            value: Ctor,
        };
    }

    function getDelayFunc(fnName: 'setInterval' | 'setTimeout') {
        return () => ({
            configurable: TRUE,
            enumerable: TRUE,
            writable: TRUE,
            value(fnOrStr: Function | string) {
                const args = arguments;
                if (typeof fnOrStr === 'function') {
                    const fn = fnOrStr;
                    args[0] = function () {
                        apply(fn, globalObject, arguments);
                    };
                } else if (typeof fnOrStr === 'string') {
                    const str = fnOrStr;
                    args[0] = () => globalObject.eval(str);
                }
                return apply(intrinsics[fnName], UNDEFINED, args);
            },
        });
    }
}

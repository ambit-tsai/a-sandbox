import { Realm } from './realm';

export type GlobalObject = Omit<typeof window, 'globalThis'> & {
    globalThis: GlobalObject;
};

export const Global: GlobalObject = window as any;
export const define = Object.defineProperty;
export const _ = { debug: false };

const { log: rawLog, warn } = console;

export function log(msg: any) {
    if (_.debug) {
        rawLog('[DEBUG]');
        if (isObject(msg)) {
            warn(msg);
        } else {
            rawLog(msg);
        }
    }
}

/**
 * Syntax: import("module-name") => __import("module-name")
 */
export const dynamicImportPattern = /(^|[^.$])(\bimport\s*(\(|\/[/*]))/g;
export const dynamicImportReplacer = '$1__$2';

export let apply: typeof Reflect['apply'];
if (Global.Reflect) {
    apply = Reflect.apply;
} else {
    const applyOfFunction = Function.prototype.apply;
    apply = function (target: Function, ctx: any, args: ArrayLike<any>) {
        return applyOfFunction.call(target, ctx, args);
    };
}

const replaceOfString = String.prototype.replace;

export function replace(
    str: string,
    ...args: [
        string | RegExp,
        string | ((substring: string, ...args: any[]) => string)
    ]
) {
    return apply(replaceOfString, str, args);
}

export function isObject(val: any): val is Record<PropertyKey, any> {
    return val ? typeof val === 'object' : false;
}

// export let { assign, keys } = Object;
// if (!assign) {
//     assign = function (target: Record<PropertyKey, any>) {
//         const args = arguments;
//         for (let i = 1, { length } = args; i < length; ++i) {
//             const source = args[i];
//             if (isObject(source)) {
//                 for (const key of keys(source)) {
//                     target[key] = source[key];
//                 }
//             }
//         }
//         return target;
//     };
// }

export function toString(val: any) {
    return Object.prototype.toString.call(val);
}

const primitiveTypes = [
    'undefined',
    'boolean',
    'string',
    'symbol',
    'number',
    'bigint',
];

export function getWrappedValue(value: any, realm: Realm): any {
    const type = typeof value;
    if (primitiveTypes.indexOf(type) !== -1) {
        return value;
    }
    if (type === 'function') {
        return createWrappedFunction(value);
    }
    if (type === 'object') {
        if (!value) {
            return value; // => null
        }
        // if (value instanceof realm.intrinsics.Promise) {
        //     return Promise.resolve(value).then(
        //         (val) => getWrappedValue(val, realm),
        //         wrapError
        //     ); // TODO:
        // }
    }
    throw new TypeError('expect primitive or callable, got ' + toString(value));
}

function createWrappedFunction(fn: Function) {
    return function () {
        const args = arguments;
        const wrappedArgs: any[] = [];
        for (let i = 0, { length } = args; i < length; ++i) {
            const wrappedValue = getWrappedValue(args[i]);
            wrappedArgs.push(wrappedValue);
        }
        const result = apply(fn, targetRealm.globalObject, wrappedArgs);
    };
    // fn.length
}

export function wrapError(reason: any, realm: Realm) {
    const type = typeof reason;
    if (primitiveTypes.indexOf(type) !== -1) {
        return reason;
    }
    if (type === 'object') {
        if (!reason || reason instanceof Object) {
            return reason;
        }
        const { name, message } = reason;
        if (
            reason instanceof realm.intrinsics.Error &&
            typeof name === 'string' &&
            /Error$/.test(name) &&
            typeof message === 'string'
        ) {
            return new (Global[name as 'Error'] || Error)(message);
        }
    }
    console.error(reason);
    return new Error('unexpected error from sandbox');
}

/**
 * Isolated function
 */
// function wrappedFunctionInContext() {
//     // @ts-ignore: `params` is in parent scope
//     const [callerRealm, targetFunction, targetRealm, utils] = params as [
//         RealmRecord,
//         Function,
//         RealmRecord,
//         Utils
//     ];
//     const { getWrappedValue } = utils;
//     let result;
//     try {
//         const args = arguments;
//         const wrappedArgs: any[] = [];
//         for (let i = 0, { length } = args; i < length; ++i) {
//             const wrappedValue = getWrappedValue(
//                 targetRealm,
//                 args[i],
//                 callerRealm,
//                 utils
//             );
//             wrappedArgs.push(wrappedValue);
//         }
//         result = utils.apply(
//             targetFunction,
//             targetRealm.globalObject,
//             wrappedArgs
//         );
//     } catch (error) {
//         throw utils.wrapError(error, callerRealm);
//     }
//     return getWrappedValue(callerRealm, result, targetRealm, utils);
// }

export const globalReservedProps = [
    // The global properties of ECMAScript 2022
    'globalThis',
    'Infinity',
    'NaN',
    'undefined',
    'eval',
    'isFinite',
    'isNaN',
    'parseFloat',
    'parseInt',
    'decodeURI',
    'decodeURIComponent',
    'encodeURI',
    'encodeURIComponent',
    'AggregateError',
    'Array',
    'ArrayBuffer',
    'Atomics',
    'BigInt',
    'BigInt64Array',
    'BigUint64Array',
    'Boolean',
    'DataView',
    'Date',
    'Error',
    'EvalError',
    'FinalizationRegistry',
    'Float32Array',
    'Float64Array',
    'Function',
    'Int8Array',
    'Int16Array',
    'Int32Array',
    'Map',
    'Number',
    'Object',
    'Promise',
    'Proxy',
    'RangeError',
    'ReferenceError',
    'RegExp',
    'Set',
    'SharedArrayBuffer',
    'String',
    'Symbol',
    'SyntaxError',
    'TypeError',
    'Uint8Array',
    'Uint8ClampedArray',
    'Uint16Array',
    'Uint32Array',
    'URIError',
    'WeakMap',
    'WeakRef',
    'WeakSet',
    'Atomics',
    'JSON',
    'Math',
    'Reflect',

    // Web API
    'atob',
    'btoa',
    'console',
    'window',
    'Blob',
    'File',
    'FileReader',
    'FormData',
    'ReadableStream',
    'TextDecoder',
    'TextDecoderStream',
    'TextEncoder',
    'TextEncoderStream',
    'URLSearchParams',
];

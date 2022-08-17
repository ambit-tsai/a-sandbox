import type { Realm } from './realm';

export type GlobalObject = Omit<typeof window, 'globalThis'> & {
    globalThis: GlobalObject;
    AudioData: new () => unknown;
    VideoFrame: new () => unknown;
    OffscreenCanvas: new () => unknown;
};

export const Global: GlobalObject = window as any;
export const define = Object.defineProperty;
export const PRIVATE_KEY = {};
const UNIQUE_PROP = Global.Symbol ? Global.Symbol('Sandbox') : '__SANDBOX__';

/**
 * Syntax: import("module-name") => __import("module-name")
 */
export const dynamicImportPattern = /(^|[^.$])(\bimport\s*(\(|\/[/*]))/g;
export const dynamicImportReplacer = '$1__$2';

export const apply = Global.Reflect
    ? Reflect.apply
    : function (target: Function, ctx: any, args: ArrayLike<any>) {
          return Function.prototype.apply.call(target, ctx, args);
      };

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

function hasOwn(o: object, v: PropertyKey): boolean {
    return Object.prototype.hasOwnProperty.call(o, v);
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
        if (hasOwn(value, UNIQUE_PROP)) {
            const [valRealm, rawFn] = value[UNIQUE_PROP];
            if (valRealm === realm) {
                return rawFn;
            }
        }
        throw new Error('xxx');
        // return createWrappedFunction(value);
    }
    if (type === 'object') {
        if (value === null) {
            return value;
        }
        const { intrinsics } = realm;
        if (value instanceof intrinsics.Promise) {
            return Promise.resolve(value).then(
                (val) => getWrappedValue(val, realm),
                (reason) => {
                    throw wrapError(reason, realm);
                }
            );
        }
        if (typeof Global.structuredClone) {
            if (
                value instanceof intrinsics.ArrayBuffer ||
                value instanceof intrinsics.MessagePort ||
                value instanceof intrinsics.ReadableStream ||
                value instanceof intrinsics.WritableStream ||
                value instanceof intrinsics.TransformStream ||
                value instanceof intrinsics.AudioData ||
                value instanceof intrinsics.VideoFrame ||
                value instanceof intrinsics.OffscreenCanvas
            ) {
                return structuredClone(value, { transfer: [value as any] });
            }
            if (
                value instanceof intrinsics.DataView ||
                value instanceof Object.getPrototypeOf(intrinsics.Int8Array)
            ) {
                return structuredClone(value, { transfer: [value.buffer] });
            }
            return structuredClone(value);
        }
        return JSON.parse(JSON.stringify(value));
    }
    console.error(value);
    throw new TypeError('unexpected type of value');
}

function createWrappedFunction(fn: Function, realm: Realm) {
    const wrappedFn = realm.intrinsics.Function(
        'params',
        'return ' + wrappedFunctionInContext.toString()
    )(arguments);
    define(wrappedFn, UNIQUE_PROP, {
        value(key: unknown) {
            if (key === PRIVATE_KEY) return [realm, fn];
        },
    });
    return wrappedFn;
}

/**
 * Isolated function
 */
function wrappedFunctionInContext() {
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
    'structuredClone',
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
    'WritableStream',
];

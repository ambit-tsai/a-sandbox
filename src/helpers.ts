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

function instanceOf(value: any, Ctor: any) {
    return typeof Ctor === 'function' && value instanceof Ctor;
}

const primitiveTypes = [
    'undefined',
    'boolean',
    'string',
    'symbol',
    'number',
    'bigint',
];

export function getWrappedValue(
    value: any,
    valueRealm: Realm,
    targetRealm: Realm
): any {
    const type = typeof value;
    if (primitiveTypes.indexOf(type) !== -1) {
        return value;
    }
    const tGlobal = targetRealm.intrinsics;
    if (type === 'function') {
        return createWrappedFunction(value, valueRealm, targetRealm);
    }
    if (type === 'object') {
        if (value === null) {
            return value;
        }
        const vGlobal = valueRealm.intrinsics;
        if (vGlobal.Promise && value instanceof vGlobal.Promise) {
            return tGlobal.Promise.resolve(value).then(
                (val) => getWrappedValue(val, valueRealm, targetRealm),
                (reason) => {
                    throw wrapError(reason, valueRealm, targetRealm);
                }
            );
        }
        const { structuredClone } = tGlobal;
        if (structuredClone) {
            if (
                instanceOf(value, vGlobal.ArrayBuffer) ||
                instanceOf(value, vGlobal.MessagePort) ||
                instanceOf(value, vGlobal.ReadableStream) ||
                instanceOf(value, vGlobal.WritableStream) ||
                instanceOf(value, vGlobal.TransformStream) ||
                instanceOf(value, vGlobal.AudioData) ||
                instanceOf(value, vGlobal.VideoFrame) ||
                instanceOf(value, vGlobal.OffscreenCanvas)
            ) {
                return structuredClone(value, { transfer: [value as any] });
            }
            if (
                instanceOf(value, vGlobal.DataView) ||
                (vGlobal.Int8Array &&
                    instanceOf(value, Object.getPrototypeOf(vGlobal.Int8Array)))
            ) {
                return structuredClone(value, { transfer: [value.buffer] });
            }
            return structuredClone(value);
        }
        return tGlobal.JSON.parse(tGlobal.JSON.stringify(value));
    }
    console.error(value);
    throw new tGlobal.TypeError('unexpected type of value');
}

function createWrappedFunction(
    fn: Function,
    valueRealm: Realm,
    targetRealm: Realm
) {
    const getWrappedFn = targetRealm.intrinsics.Function(
        'cb',
        'return function(){return cb(arguments)}'
    );
    return getWrappedFn((args: IArguments) => {
        const wrappedArgs: any[] = [];
        for (let i = 0, { length } = args; i < length; ++i) {
            const wrappedValue = getWrappedValue(
                args[i],
                targetRealm,
                valueRealm
            );
            wrappedArgs.push(wrappedValue);
        }
        return apply(fn, null, args);
    });
}

export function wrapError(reason: any, valueRealm: Realm, targetRealm: Realm) {
    const type = typeof reason;
    if (primitiveTypes.indexOf(type) !== -1) {
        return reason;
    }
    const vGlobal = valueRealm.intrinsics;
    const tGlobal = targetRealm.intrinsics;
    if (type === 'object') {
        if (!reason || reason instanceof vGlobal.Object) {
            return reason;
        }
        const { name, message } = reason;
        if (
            reason instanceof vGlobal.Error &&
            typeof name === 'string' &&
            /Error$/.test(name) &&
            typeof message === 'string'
        ) {
            return new (tGlobal[name as 'Error'] || tGlobal.Error)(message);
        }
    }
    console.error(reason);
    return new tGlobal.Error('unexpected error from sandbox');
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

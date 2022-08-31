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
    if (type === 'function') {
        return createWrappedFunction(value, valueRealm, targetRealm);
    }
    const vGlobal = valueRealm.intrinsics;
    const tGlobal = targetRealm.intrinsics;
    if (type === 'object') {
        if (value === null) {
            return value;
        }
        if (vGlobal.Promise && value instanceof vGlobal.Promise) {
            return new tGlobal.Promise((resolve, reject) => {
                Promise.resolve(value)
                    .then((val) => {
                        const wrapped = getWrappedValue(
                            val,
                            valueRealm,
                            targetRealm
                        );
                        resolve(wrapped);
                    })
                    .catch((reason) => {
                        const wrapped = wrapError(
                            reason,
                            valueRealm,
                            targetRealm
                        );
                        reject(wrapped);
                    });
            });
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
                instanceOf(value, valueRealm.TypedArray)
            ) {
                return structuredClone(value, { transfer: [value.buffer] });
            }
            return structuredClone(value);
        }
        return targetRealm.str2json(targetRealm.json2str(value));
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
    return getWrappedFn((args: any[]) => {
        try {
            const wrappedArgs: any[] = []; //TODO:
            for (const arg of args) {
                const wrappedValue = getWrappedValue(
                    arg,
                    targetRealm,
                    valueRealm
                );
                wrappedArgs.push(wrappedValue);
            }
            const result = apply(fn, undefined, wrappedArgs);
            return getWrappedValue(result, valueRealm, targetRealm);
        } catch (error) {
            throw wrapError(error, valueRealm, targetRealm);
        }
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
        if (!reason || reason instanceof tGlobal.Object) {
            return reason;
        }
        const { name, message } = reason;
        if (typeof name === 'string' && typeof message === 'string') {
            if (reason instanceof vGlobal.DOMException) {
                return new tGlobal.DOMException(message, name);
            }
            if (
                reason instanceof vGlobal.Error &&
                /^[A-Z]/.test(name) &&
                /Error$/.test(name)
            ) {
                return new (tGlobal[name as 'Error'] || tGlobal.Error)(message);
            }
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

    // Host API
    'atob',
    'btoa',
    'clearInterval',
    'clearTimeout',
    'console',
    // 'setInterval',
    // 'setTimeout',
    'structuredClone',
    'window',
    'Blob',
    'DOMException',
    'File',
    'FileReader',
    'FormData',
    'ReadableStream',
    'TextDecoder',
    'TextDecoderStream',
    'TextEncoder',
    'TextEncoderStream',
    'TransformStream',
    'URL',
    'URLSearchParams',
    'WritableStream',
];

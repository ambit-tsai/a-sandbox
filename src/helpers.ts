import type { Realm } from './realm';

export type GlobalObject = Omit<typeof window, 'globalThis'> & {
    globalThis: GlobalObject;
    AudioData: new () => unknown;
    VideoFrame: new () => unknown;
    OffscreenCanvas: new () => unknown;
};

export const Global: GlobalObject = window as any;
export const define = Object.defineProperty;

export const apply = Global.Reflect
    ? Reflect.apply
    : function (target: Function, ctx: any, args: ArrayLike<any>) {
          return Function.prototype.apply.call(target, ctx, args);
      };

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
    const vIntrinsics = valueRealm.intrinsics;
    const tIntrinsics = targetRealm.intrinsics;
    if (type === 'object') {
        if (value === null) {
            return value;
        }
        if (vIntrinsics.Promise && value instanceof vIntrinsics.Promise) {
            return new tIntrinsics.Promise((resolve, reject) => {
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
        const { structuredClone } = tIntrinsics;
        if (structuredClone) {
            if (
                instanceOf(value, vIntrinsics.ArrayBuffer) ||
                instanceOf(value, vIntrinsics.MessagePort) ||
                instanceOf(value, vIntrinsics.ReadableStream) ||
                instanceOf(value, vIntrinsics.WritableStream) ||
                instanceOf(value, vIntrinsics.TransformStream) ||
                instanceOf(value, vIntrinsics.AudioData) ||
                instanceOf(value, vIntrinsics.VideoFrame) ||
                instanceOf(value, vIntrinsics.OffscreenCanvas)
            ) {
                return structuredClone(value, { transfer: [value as any] });
            }
            if (
                instanceOf(value, vIntrinsics.DataView) ||
                instanceOf(value, valueRealm.TypedArray)
            ) {
                return structuredClone(value, { transfer: [value.buffer] });
            }
            return structuredClone(value);
        }
        return targetRealm.str2json(targetRealm.json2str(value));
    }
    console.error(value);
    throw new tIntrinsics.TypeError('unexpected type of value');
}

function createWrappedFunction(
    fn: Function,
    valueRealm: Realm,
    targetRealm: Realm
) {
    const getWrappedFn = targetRealm.intrinsics.Function(
        'f',
        'return function(){return f(arguments)}'
    );
    return getWrappedFn((args: any[]) => {
        try {
            const wrappedArgs: any[] = [];
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
    const vIntrinsics = valueRealm.intrinsics;
    const tIntrinsics = targetRealm.intrinsics;
    if (type === 'object') {
        if (!reason || reason instanceof tIntrinsics.Object) {
            return reason;
        }
        const { name, message } = reason;
        if (typeof name === 'string' && typeof message === 'string') {
            if (reason instanceof vIntrinsics.DOMException) {
                return new tIntrinsics.DOMException(message, name);
            }
            if (
                reason instanceof vIntrinsics.Error &&
                /^[A-Z]/.test(name) &&
                /Error$/.test(name)
            ) {
                return new (tIntrinsics[name as 'Error'] || tIntrinsics.Error)(
                    message
                );
            }
        }
    }
    console.error(reason);
    return new tIntrinsics.Error('unexpected error from sandbox');
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
    'setInterval',
    'setTimeout',
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

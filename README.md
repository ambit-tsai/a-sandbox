# A Sandbox
本沙箱借鉴了 <a href="https://github.com/ambit-tsai/shadowrealm-api" target="_blank">ShadowRealm API</a> 的设计思路，严格限制沙箱内外交互的数据类型，以保证良好的隔离性与安全性，并针对其不满足需求的地方做了扩展设计，如：允许用户自行定制、允许传递`Promise`等。

<a href="https://ambit-tsai.github.io/a-sandbox/" target="_blank">✨ 在线试用一下</a>


## Features
1. 沙箱内外交互允许的数据类型有原始类型（Primitive）、函数类型（Callable）、`Promise`类型，以及<a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#supported_types" target="_blank">可被结构化克隆的数据</a>（如：`Array`、`Blob`、`Date`、`Int8Array`等）；
1. 除了 ECMA-262 规范中定义的全局对象外，还默认支持部分浏览器环境的对象，如`atob`、`Crypto`、`TextEncoder`、`URL`等，不会对沙箱外产生副作用；
1. 允许用户自行定制，通过钩子`onInit`可以拿到`realm`对象，`realm`保存着沙箱内部使用的数据（如：全局对象、`iframe`等）； 
1. 兼容性极佳，编译输出的代码为 **ES5**，并且对所有用到的比 ES5 新的 API 都做了兼容处理；


## Install
```shell
npm install a-sandbox
```


## Usages
```ts
export default class Sandbox {
    constructor(options?: {
        onInit: (realm: Realm) => void;
    });

    /**
     * Eval code string in sandbox
     * @return callable, structured or promise data
     */
    evaluate(sourceText: string): any;

    /**
     * Run function in sandbox
     * @return the same as `evaluate`
     */
    evaluateHandle(func: (this: undefined) => any): any;
}
```

- 在沙箱中执行代码
```ts
import Sandbox from "a-sandbox";

const aSandbox = new Sandbox();

aSandbox.evaluate(`
    console.log(globalThis); // sandbox's global object
`);

aSandbox.evaluateHandle(() => {
    console.log(globalThis); // sandbox's global object
});
```

- 自行定制：允许沙箱内使用`localStorage`
```ts
import Sandbox, { Realm } from "a-sandbox";

const aSandbox = new Sandbox({ onInit });

function onInit(realm: Realm){
    realm.globalObject.localStorage = realm.intrinsics.localStorage;
}
```
`realm`保存着沙箱内部使用的数据，需谨慎操作。其中，`globalObject`值为沙箱的全局对象，沙箱关联的`iframe`的初始全局对象的属性值备份在`intrinsics`对象上。

- 自行定制：向沙箱中注入全局变量
```ts
import Sandbox, { Realm } from "a-sandbox";

const aSandbox = new Sandbox({ onInit });

function onInit(realm: Realm){
    const createPostMyMessage = realm.intrinsics.eval(`
        (cb) => function(){ return cb(arguments) }
    `);
    realm.globalObject.postMyMessage = createPostMyMessage(onMyMessage);
}

function onMyMessage(args: any[]) {
    console.log(args);
}
```
> ⚠️ 进行定制时，**不能**将外部的对象泄漏到沙箱中，防止沙箱中的代码通过**原型链**对外部进行攻击。

在上述的代码中，先通过沙箱中的`eval`生成安全的工厂函数，再将外部的`onMyMessage`作为入参传给工厂函数生成`postMyMessage`函数，沙箱中以闭包的形式来安全地调用外部函数`onMyMessage`。


## Contact
1. 邮箱: ambit_tsai@qq.com
1. 微信: cai_fanwei
1. QQ群: 663286147

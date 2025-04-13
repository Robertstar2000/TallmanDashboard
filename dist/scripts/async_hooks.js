// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _StorageKey_dead, _AsyncLocalStorage_key;
// This implementation is inspired by "workerd" AsyncLocalStorage implementation:
// https://github.com/cloudflare/workerd/blob/77fd0ed6ddba184414f0216508fc62b06e716cab/src/workerd/api/node/async-hooks.c++#L9
import { validateFunction } from "./internal/validators.mjs";
import { core } from "./_core.ts";
function assert(cond) {
    if (!cond)
        throw new Error("Assertion failed");
}
const asyncContextStack = [];
function pushAsyncFrame(frame) {
    asyncContextStack.push(frame);
}
function popAsyncFrame() {
    assert(asyncContextStack.length > 0);
    asyncContextStack.pop();
}
let rootAsyncFrame = undefined;
let promiseHooksSet = false;
const asyncContext = Symbol("asyncContext");
function isRejected(promise) {
    const [state] = core.getPromiseDetails(promise);
    return state == 2;
}
function setPromiseHooks() {
    if (promiseHooksSet) {
        return;
    }
    promiseHooksSet = true;
    const init = (promise) => {
        const currentFrame = AsyncContextFrame.current();
        if (!currentFrame.isRoot()) {
            assert(AsyncContextFrame.tryGetContext(promise) == null);
            AsyncContextFrame.attachContext(promise);
        }
    };
    const before = (promise) => {
        const maybeFrame = AsyncContextFrame.tryGetContext(promise);
        if (maybeFrame) {
            pushAsyncFrame(maybeFrame);
        }
        else {
            pushAsyncFrame(AsyncContextFrame.getRootAsyncContext());
        }
    };
    const after = (promise) => {
        popAsyncFrame();
        if (!isRejected(promise)) {
            // @ts-ignore promise async context
            delete promise[asyncContext];
        }
    };
    const resolve = (promise) => {
        const currentFrame = AsyncContextFrame.current();
        if (!currentFrame.isRoot() && isRejected(promise) &&
            AsyncContextFrame.tryGetContext(promise) == null) {
            AsyncContextFrame.attachContext(promise);
        }
    };
    core.setPromiseHooks(init, before, after, resolve);
}
class AsyncContextFrame {
    constructor(maybeParent, maybeStorageEntry, isRoot = false) {
        this.storage = [];
        setPromiseHooks();
        const propagate = (parent) => {
            parent.storage = parent.storage.filter((entry) => !entry.key.isDead());
            parent.storage.forEach((entry) => this.storage.push(entry));
            if (maybeStorageEntry) {
                const existingEntry = this.storage.find((entry) => entry.key === maybeStorageEntry.key);
                if (existingEntry) {
                    existingEntry.value = maybeStorageEntry.value;
                }
                else {
                    this.storage.push(maybeStorageEntry);
                }
            }
        };
        if (!isRoot) {
            if (maybeParent) {
                propagate(maybeParent);
            }
            else {
                propagate(AsyncContextFrame.current());
            }
        }
    }
    static tryGetContext(promise) {
        // @ts-ignore promise async context
        return promise[asyncContext];
    }
    static attachContext(promise) {
        assert(!(asyncContext in promise));
        // @ts-ignore promise async context
        promise[asyncContext] = AsyncContextFrame.current();
    }
    static getRootAsyncContext() {
        if (typeof rootAsyncFrame !== "undefined") {
            return rootAsyncFrame;
        }
        rootAsyncFrame = new AsyncContextFrame(null, null, true);
        return rootAsyncFrame;
    }
    static current() {
        if (asyncContextStack.length === 0) {
            return AsyncContextFrame.getRootAsyncContext();
        }
        return asyncContextStack[asyncContextStack.length - 1];
    }
    static create(maybeParent, maybeStorageEntry) {
        return new AsyncContextFrame(maybeParent, maybeStorageEntry);
    }
    static wrap(fn, maybeFrame, 
    // deno-lint-ignore no-explicit-any
    thisArg) {
        // deno-lint-ignore no-explicit-any
        return (...args) => {
            const frame = maybeFrame || AsyncContextFrame.current();
            Scope.enter(frame);
            try {
                return fn.apply(thisArg, args);
            }
            finally {
                Scope.exit();
            }
        };
    }
    get(key) {
        assert(!key.isDead());
        this.storage = this.storage.filter((entry) => !entry.key.isDead());
        const entry = this.storage.find((entry) => entry.key === key);
        if (entry) {
            return entry.value;
        }
        return undefined;
    }
    isRoot() {
        return AsyncContextFrame.getRootAsyncContext() == this;
    }
}
export class AsyncResource {
    constructor(type) {
        this.type = type;
        this.frame = AsyncContextFrame.current();
    }
    runInAsyncScope(fn, thisArg, ...args) {
        Scope.enter(this.frame);
        try {
            return fn.apply(thisArg, args);
        }
        finally {
            Scope.exit();
        }
    }
    bind(fn, thisArg = this) {
        validateFunction(fn, "fn");
        const frame = AsyncContextFrame.current();
        const bound = AsyncContextFrame.wrap(fn, frame, thisArg);
        Object.defineProperties(bound, {
            "length": {
                configurable: true,
                enumerable: false,
                value: fn.length,
                writable: false,
            },
            "asyncResource": {
                configurable: true,
                enumerable: true,
                value: this,
                writable: true,
            },
        });
        return bound;
    }
    static bind(fn, type, thisArg) {
        type = type || fn.name;
        return (new AsyncResource(type || "AsyncResource")).bind(fn, thisArg);
    }
}
class Scope {
    static enter(maybeFrame) {
        if (maybeFrame) {
            pushAsyncFrame(maybeFrame);
        }
        else {
            pushAsyncFrame(AsyncContextFrame.getRootAsyncContext());
        }
    }
    static exit() {
        popAsyncFrame();
    }
}
class StorageEntry {
    constructor(key, value) {
        this.key = key;
        this.value = value;
    }
}
class StorageKey {
    constructor() {
        _StorageKey_dead.set(this, false);
    }
    reset() {
        __classPrivateFieldSet(this, _StorageKey_dead, true, "f");
    }
    isDead() {
        return __classPrivateFieldGet(this, _StorageKey_dead, "f");
    }
}
_StorageKey_dead = new WeakMap();
const fnReg = new FinalizationRegistry((key) => {
    key.reset();
});
export class AsyncLocalStorage {
    constructor() {
        _AsyncLocalStorage_key.set(this, void 0);
        __classPrivateFieldSet(this, _AsyncLocalStorage_key, new StorageKey(), "f");
        fnReg.register(this, __classPrivateFieldGet(this, _AsyncLocalStorage_key, "f"));
    }
    // deno-lint-ignore no-explicit-any
    run(store, callback, ...args) {
        const frame = AsyncContextFrame.create(null, new StorageEntry(__classPrivateFieldGet(this, _AsyncLocalStorage_key, "f"), store));
        Scope.enter(frame);
        let res;
        try {
            res = callback(...args);
        }
        finally {
            Scope.exit();
        }
        return res;
    }
    // deno-lint-ignore no-explicit-any
    exit(callback, ...args) {
        return this.run(undefined, callback, args);
    }
    // deno-lint-ignore no-explicit-any
    getStore() {
        const currentFrame = AsyncContextFrame.current();
        return currentFrame.get(__classPrivateFieldGet(this, _AsyncLocalStorage_key, "f"));
    }
}
_AsyncLocalStorage_key = new WeakMap();
export function executionAsyncId() {
    return 1;
}
class AsyncHook {
    enable() {
    }
    disable() {
    }
}
export function createHook() {
    return new AsyncHook();
}
// Placing all exports down here because the exported classes won't export
// otherwise.
export default {
    // Embedder API
    AsyncResource,
    executionAsyncId,
    createHook,
    AsyncLocalStorage,
};

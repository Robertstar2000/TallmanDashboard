// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function () { return this; }, i;
    function awaitReturn(f) { return function (v) { return Promise.resolve(v).then(f, reject); }; }
    function verb(n, f) { if (g[n]) { i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; if (f) i[n] = f(i[n]); } }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
var _Queue_source, _Queue_queue;
class Queue {
    constructor(iterable) {
        _Queue_source.set(this, void 0);
        _Queue_queue.set(this, void 0);
        __classPrivateFieldSet(this, _Queue_source, iterable[Symbol.asyncIterator](), "f");
        __classPrivateFieldSet(this, _Queue_queue, {
            value: undefined,
            next: undefined,
        }, "f");
        this.head = __classPrivateFieldGet(this, _Queue_queue, "f");
        this.done = false;
    }
    next() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield __classPrivateFieldGet(this, _Queue_source, "f").next();
            if (!result.done) {
                const nextNode = {
                    value: result.value,
                    next: undefined,
                };
                __classPrivateFieldGet(this, _Queue_queue, "f").next = nextNode;
                __classPrivateFieldSet(this, _Queue_queue, nextNode, "f");
            }
            else {
                this.done = true;
            }
        });
    }
}
_Queue_source = new WeakMap(), _Queue_queue = new WeakMap();
/**
 * Branches the given async iterable into the n branches.
 *
 * @example
 * ```ts
 * import { tee } from "https://deno.land/std@$STD_VERSION/async/tee.ts";
 *
 * const gen = async function* gen() {
 *   yield 1;
 *   yield 2;
 *   yield 3;
 * };
 *
 * const [branch1, branch2] = tee(gen());
 *
 * for await (const n of branch1) {
 *   console.log(n); // => 1, 2, 3
 * }
 *
 * for await (const n of branch2) {
 *   console.log(n); // => 1, 2, 3
 * }
 * ```
 */
export function tee(iterable, n = 2) {
    const queue = new Queue(iterable);
    function generator() {
        return __asyncGenerator(this, arguments, function* generator_1() {
            let buffer = queue.head;
            while (true) {
                if (buffer.next) {
                    buffer = buffer.next;
                    yield yield __await(buffer.value);
                }
                else if (queue.done) {
                    return yield __await(void 0);
                }
                else {
                    yield __await(queue.next());
                }
            }
        });
    }
    const branches = Array.from({ length: n }).map(() => generator());
    return branches;
}

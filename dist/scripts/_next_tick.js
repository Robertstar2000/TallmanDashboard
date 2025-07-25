// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and other Node contributors.
// deno-lint-ignore-file no-inner-declarations
import { core } from "./_core.ts";
import { validateFunction } from "./internal/validators.mjs";
import { _exiting } from "./_process/exiting.ts";
import { FixedQueue } from "./internal/fixed_queue.ts";
const queue = new FixedQueue();
// deno-lint-ignore no-explicit-any
let _nextTick;
export function processTicksAndRejections() {
    let tock;
    do {
        // deno-lint-ignore no-cond-assign
        while (tock = queue.shift()) {
            // FIXME(bartlomieju): Deno currently doesn't support async hooks
            // const asyncId = tock[async_id_symbol];
            // emitBefore(asyncId, tock[trigger_async_id_symbol], tock);
            try {
                const callback = tock.callback;
                if (tock.args === undefined) {
                    callback();
                }
                else {
                    const args = tock.args;
                    switch (args.length) {
                        case 1:
                            callback(args[0]);
                            break;
                        case 2:
                            callback(args[0], args[1]);
                            break;
                        case 3:
                            callback(args[0], args[1], args[2]);
                            break;
                        case 4:
                            callback(args[0], args[1], args[2], args[3]);
                            break;
                        default:
                            callback(...args);
                    }
                }
            }
            finally {
                // FIXME(bartlomieju): Deno currently doesn't support async hooks
                // if (destroyHooksExist())
                // emitDestroy(asyncId);
            }
            // FIXME(bartlomieju): Deno currently doesn't support async hooks
            // emitAfter(asyncId);
        }
        core.runMicrotasks();
        // FIXME(bartlomieju): Deno currently doesn't unhandled rejections
        // } while (!queue.isEmpty() || processPromiseRejections());
    } while (!queue.isEmpty());
    core.setHasTickScheduled(false);
    // FIXME(bartlomieju): Deno currently doesn't unhandled rejections
    // setHasRejectionToWarn(false);
}
if (typeof core.setNextTickCallback !== "undefined") {
    function runNextTicks() {
        // FIXME(bartlomieju): Deno currently doesn't unhandled rejections
        // if (!hasTickScheduled() && !hasRejectionToWarn())
        //   runMicrotasks();
        // if (!hasTickScheduled() && !hasRejectionToWarn())
        //   return;
        if (!core.hasTickScheduled()) {
            core.runMicrotasks();
        }
        if (!core.hasTickScheduled()) {
            return true;
        }
        processTicksAndRejections();
        return true;
    }
    core.setNextTickCallback(processTicksAndRejections);
    core.setMacrotaskCallback(runNextTicks);
    function __nextTickNative(callback, ...args) {
        validateFunction(callback, "callback");
        if (_exiting) {
            return;
        }
        // TODO(bartlomieju): seems superfluous if we don't depend on `arguments`
        let args_;
        switch (args.length) {
            case 0:
                break;
            case 1:
                args_ = [args[0]];
                break;
            case 2:
                args_ = [args[0], args[1]];
                break;
            case 3:
                args_ = [args[0], args[1], args[2]];
                break;
            default:
                args_ = new Array(args.length);
                for (let i = 0; i < args.length; i++) {
                    args_[i] = args[i];
                }
        }
        if (queue.isEmpty()) {
            core.setHasTickScheduled(true);
        }
        // FIXME(bartlomieju): Deno currently doesn't support async hooks
        // const asyncId = newAsyncId();
        // const triggerAsyncId = getDefaultTriggerAsyncId();
        const tickObject = {
            // FIXME(bartlomieju): Deno currently doesn't support async hooks
            // [async_id_symbol]: asyncId,
            // [trigger_async_id_symbol]: triggerAsyncId,
            callback,
            args: args_,
        };
        // FIXME(bartlomieju): Deno currently doesn't support async hooks
        // if (initHooksExist())
        //   emitInit(asyncId, 'TickObject', triggerAsyncId, tickObject);
        queue.push(tickObject);
    }
    _nextTick = __nextTickNative;
}
else {
    function __nextTickQueueMicrotask(callback, ...args) {
        if (args) {
            queueMicrotask(() => callback.call(this, ...args));
        }
        else {
            queueMicrotask(callback);
        }
    }
    _nextTick = __nextTickQueueMicrotask;
}
export function nextTick(callback, ...args) {
    _nextTick(callback, ...args);
}

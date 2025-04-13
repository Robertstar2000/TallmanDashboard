// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _a, _b;
var _Process_startTime, _Process_allowedFlags;
import { notImplemented, warnNotImplemented } from "./_utils.ts";
import { EventEmitter } from "./events.ts";
import { validateString } from "./internal/validators.mjs";
import { ERR_INVALID_ARG_TYPE, ERR_UNKNOWN_SIGNAL, errnoException, } from "./internal/errors.ts";
import { getOptionValue } from "./internal/options.ts";
import { assert } from "../_util/asserts.ts";
import { fromFileUrl, join } from "../path/mod.ts";
import { arch, chdir, cwd, env, nextTick as _nextTick, pid, platform, version, versions, } from "./_process/process.ts";
import { _exiting } from "./_process/exiting.ts";
export { _nextTick as nextTick, arch, argv, chdir, cwd, env, pid, platform, version, versions, };
import { stderr as stderr_, stdin as stdin_, stdout as stdout_, } from "./_process/streams.mjs";
import { core } from "./_core.ts";
import { processTicksAndRejections } from "./_next_tick.ts";
// TODO(kt3k): Give better types to stdio objects
// deno-lint-ignore no-explicit-any
const stderr = stderr_;
// deno-lint-ignore no-explicit-any
const stdin = stdin_;
// deno-lint-ignore no-explicit-any
const stdout = stdout_;
export { stderr, stdin, stdout };
import { getBinding } from "./internal_binding/mod.ts";
import * as constants from "./internal_binding/constants.ts";
import * as uv from "./internal_binding/uv.ts";
import { buildAllowedFlags } from "./internal/process/per_thread.mjs";
// @ts-ignore Deno[Deno.internal] is used on purpose here
const DenoCommand = ((_b = (_a = Deno[Deno.internal]) === null || _a === void 0 ? void 0 : _a.nodeUnstable) === null || _b === void 0 ? void 0 : _b.Command) ||
    Deno.Command;
const notImplementedEvents = [
    "disconnect",
    "message",
    "multipleResolves",
    "rejectionHandled",
    "worker",
];
// The first 2 items are placeholders.
// They will be overwritten by the below Object.defineProperty calls.
const argv = ["", "", ...Deno.args];
// Overwrites the 1st item with getter.
Object.defineProperty(argv, "0", { get: Deno.execPath });
// Overwrites the 2st item with getter.
Object.defineProperty(argv, "1", {
    get: () => {
        if (Deno.mainModule.startsWith("file:")) {
            return fromFileUrl(Deno.mainModule);
        }
        else {
            return join(Deno.cwd(), "$deno$node.js");
        }
    },
});
/** https://nodejs.org/api/process.html#process_process_exit_code */
export const exit = (code) => {
    if (code || code === 0) {
        if (typeof code === "string") {
            const parsedCode = parseInt(code);
            process.exitCode = isNaN(parsedCode) ? undefined : parsedCode;
        }
        else {
            process.exitCode = code;
        }
    }
    if (!process._exiting) {
        process._exiting = true;
        // FIXME(bartlomieju): this is wrong, we won't be using syscall to exit
        // and thus the `unload` event will not be emitted to properly trigger "emit"
        // event on `process`.
        process.emit("exit", process.exitCode || 0);
    }
    Deno.exit(process.exitCode || 0);
};
function addReadOnlyProcessAlias(name, option, enumerable = true) {
    const value = getOptionValue(option);
    if (value) {
        Object.defineProperty(process, name, {
            writable: false,
            configurable: true,
            enumerable,
            value,
        });
    }
}
function createWarningObject(warning, type, code, 
// deno-lint-ignore ban-types
ctor, detail) {
    assert(typeof warning === "string");
    // deno-lint-ignore no-explicit-any
    const warningErr = new Error(warning);
    warningErr.name = String(type || "Warning");
    if (code !== undefined) {
        warningErr.code = code;
    }
    if (detail !== undefined) {
        warningErr.detail = detail;
    }
    // @ts-ignore this function is not available in lib.dom.d.ts
    Error.captureStackTrace(warningErr, ctor || process.emitWarning);
    return warningErr;
}
function doEmitWarning(warning) {
    process.emit("warning", warning);
}
/** https://nodejs.org/api/process.html#process_process_emitwarning_warning_options */
export function emitWarning(warning, type, code, 
// deno-lint-ignore ban-types
ctor) {
    let detail;
    if (type !== null && typeof type === "object" && !Array.isArray(type)) {
        ctor = type.ctor;
        code = type.code;
        if (typeof type.detail === "string") {
            detail = type.detail;
        }
        type = type.type || "Warning";
    }
    else if (typeof type === "function") {
        ctor = type;
        code = undefined;
        type = "Warning";
    }
    if (type !== undefined) {
        validateString(type, "type");
    }
    if (typeof code === "function") {
        ctor = code;
        code = undefined;
    }
    else if (code !== undefined) {
        validateString(code, "code");
    }
    if (typeof warning === "string") {
        warning = createWarningObject(warning, type, code, ctor, detail);
    }
    else if (!(warning instanceof Error)) {
        throw new ERR_INVALID_ARG_TYPE("warning", ["Error", "string"], warning);
    }
    if (warning.name === "DeprecationWarning") {
        // deno-lint-ignore no-explicit-any
        if (process.noDeprecation) {
            return;
        }
        // deno-lint-ignore no-explicit-any
        if (process.throwDeprecation) {
            // Delay throwing the error to guarantee that all former warnings were
            // properly logged.
            return process.nextTick(() => {
                throw warning;
            });
        }
    }
    process.nextTick(doEmitWarning, warning);
}
export function hrtime(time) {
    const milli = performance.now();
    const sec = Math.floor(milli / 1000);
    const nano = Math.floor(milli * 1000000 - sec * 1000000000);
    if (!time) {
        return [sec, nano];
    }
    const [prevSec, prevNano] = time;
    return [sec - prevSec, nano - prevNano];
}
hrtime.bigint = function () {
    const [sec, nano] = hrtime();
    return BigInt(sec) * 1000000000n + BigInt(nano);
};
export function memoryUsage() {
    return Object.assign(Object.assign({}, Deno.memoryUsage()), { arrayBuffers: 0 });
}
memoryUsage.rss = function () {
    return memoryUsage().rss;
};
// Returns a negative error code than can be recognized by errnoException
function _kill(pid, sig) {
    let errCode;
    if (sig === 0) {
        let status;
        if (Deno.build.os === "windows") {
            status = (new DenoCommand("powershell.exe", {
                args: ["Get-Process", "-pid", pid],
            })).outputSync();
        }
        else {
            status = (new DenoCommand("kill", {
                args: ["-0", pid],
            })).outputSync();
        }
        if (!status.success) {
            errCode = uv.codeMap.get("ESRCH");
        }
    }
    else {
        // Reverse search the shortname based on the numeric code
        const maybeSignal = Object.entries(constants.os.signals).find(([_, numericCode]) => numericCode === sig);
        if (!maybeSignal) {
            errCode = uv.codeMap.get("EINVAL");
        }
        else {
            try {
                Deno.kill(pid, maybeSignal[0]);
            }
            catch (e) {
                if (e instanceof TypeError) {
                    throw notImplemented(maybeSignal[0]);
                }
                throw e;
            }
        }
    }
    if (!errCode) {
        return 0;
    }
    else {
        return errCode;
    }
}
export function kill(pid, sig = "SIGTERM") {
    if (pid != (pid | 0)) {
        throw new ERR_INVALID_ARG_TYPE("pid", "number", pid);
    }
    let err;
    if (typeof sig === "number") {
        err = process._kill(pid, sig);
    }
    else {
        if (sig in constants.os.signals) {
            // @ts-ignore Index previously checked
            err = process._kill(pid, constants.os.signals[sig]);
        }
        else {
            throw new ERR_UNKNOWN_SIGNAL(sig);
        }
    }
    if (err) {
        throw errnoException(err, "kill");
    }
    return true;
}
// deno-lint-ignore no-explicit-any
function uncaughtExceptionHandler(err, origin) {
    // The origin parameter can be 'unhandledRejection' or 'uncaughtException'
    // depending on how the uncaught exception was created. In Node.js,
    // exceptions thrown from the top level of a CommonJS module are reported as
    // 'uncaughtException', while exceptions thrown from the top level of an ESM
    // module are reported as 'unhandledRejection'. Deno does not have a true
    // CommonJS implementation, so all exceptions thrown from the top level are
    // reported as 'uncaughtException'.
    process.emit("uncaughtExceptionMonitor", err, origin);
    process.emit("uncaughtException", err, origin);
}
let execPath = null;
class Process extends EventEmitter {
    constructor() {
        super();
        /** https://nodejs.org/api/process.html#process_process_arch */
        this.arch = arch;
        /**
         * https://nodejs.org/api/process.html#process_process_argv
         * Read permissions are required in order to get the executable route
         */
        this.argv = argv;
        /** https://nodejs.org/api/process.html#process_process_chdir_directory */
        this.chdir = chdir;
        /** https://nodejs.org/api/process.html#processconfig */
        this.config = {
            target_defaults: {},
            variables: {},
        };
        /** https://nodejs.org/api/process.html#process_process_cwd */
        this.cwd = cwd;
        /**
         * https://nodejs.org/api/process.html#process_process_env
         * Requires env permissions
         */
        this.env = env;
        /** https://nodejs.org/api/process.html#process_process_execargv */
        this.execArgv = [];
        /** https://nodejs.org/api/process.html#process_process_exit_code */
        this.exit = exit;
        this._exiting = _exiting;
        /** https://nodejs.org/api/process.html#processexitcode_1 */
        this.exitCode = undefined;
        // Typed as any to avoid importing "module" module for types
        // deno-lint-ignore no-explicit-any
        this.mainModule = undefined;
        /** https://nodejs.org/api/process.html#process_process_nexttick_callback_args */
        this.nextTick = _nextTick;
        /** https://nodejs.org/api/process.html#process_process_pid */
        this.pid = pid;
        /** https://nodejs.org/api/process.html#process_process_platform */
        this.platform = platform;
        /**
         * Returns the current high-resolution real time in a [seconds, nanoseconds]
         * tuple.
         *
         * Note: You need to give --allow-hrtime permission to Deno to actually get
         * nanoseconds precision values. If you don't give 'hrtime' permission, the returned
         * values only have milliseconds precision.
         *
         * `time` is an optional parameter that must be the result of a previous process.hrtime() call to diff with the current time.
         *
         * These times are relative to an arbitrary time in the past, and not related to the time of day and therefore not subject to clock drift. The primary use is for measuring performance between intervals.
         * https://nodejs.org/api/process.html#process_process_hrtime_time
         */
        this.hrtime = hrtime;
        /**
         * @private
         *
         * NodeJS internal, use process.kill instead
         */
        this._kill = _kill;
        /** https://nodejs.org/api/process.html#processkillpid-signal */
        this.kill = kill;
        this.memoryUsage = memoryUsage;
        /** https://nodejs.org/api/process.html#process_process_stderr */
        this.stderr = stderr;
        /** https://nodejs.org/api/process.html#process_process_stdin */
        this.stdin = stdin;
        /** https://nodejs.org/api/process.html#process_process_stdout */
        this.stdout = stdout;
        /** https://nodejs.org/api/process.html#process_process_version */
        this.version = version;
        /** https://nodejs.org/api/process.html#process_process_versions */
        this.versions = versions;
        /** https://nodejs.org/api/process.html#process_process_emitwarning_warning_options */
        this.emitWarning = emitWarning;
        // TODO(kt3k): Implement this when we added -e option to node compat mode
        this._eval = undefined;
        _Process_startTime.set(this, Date.now());
        _Process_allowedFlags.set(this, buildAllowedFlags());
        this.features = { inspector: false };
        // TODO(kt3k): Get the value from --no-deprecation flag.
        this.noDeprecation = false;
        globalThis.addEventListener("unhandledrejection", (event) => {
            if (process.listenerCount("unhandledRejection") === 0) {
                // The Node.js default behavior is to raise an uncaught exception if
                // an unhandled rejection occurs and there are no unhandledRejection
                // listeners.
                if (process.listenerCount("uncaughtException") === 0) {
                    throw event.reason;
                }
                event.preventDefault();
                uncaughtExceptionHandler(event.reason, "unhandledRejection");
                return;
            }
            event.preventDefault();
            process.emit("unhandledRejection", event.reason, event.promise);
        });
        globalThis.addEventListener("error", (event) => {
            if (process.listenerCount("uncaughtException") > 0) {
                event.preventDefault();
            }
            uncaughtExceptionHandler(event.error, "uncaughtException");
        });
        globalThis.addEventListener("beforeunload", (e) => {
            super.emit("beforeExit", process.exitCode || 0);
            processTicksAndRejections();
            if (core.eventLoopHasMoreWork()) {
                e.preventDefault();
            }
        });
        globalThis.addEventListener("unload", () => {
            if (!process._exiting) {
                process._exiting = true;
                super.emit("exit", process.exitCode || 0);
            }
        });
    }
    // deno-lint-ignore no-explicit-any
    on(event, listener) {
        if (notImplementedEvents.includes(event)) {
            warnNotImplemented(`process.on("${event}")`);
            super.on(event, listener);
        }
        else if (event.startsWith("SIG")) {
            if (event === "SIGBREAK" && Deno.build.os !== "windows") {
                // Ignores SIGBREAK if the platform is not windows.
            }
            else if (event === "SIGTERM" && Deno.build.os === "windows") {
                // Ignores SIGTERM on windows.
            }
            else {
                Deno.addSignalListener(event, listener);
            }
        }
        else {
            super.on(event, listener);
        }
        return this;
    }
    // deno-lint-ignore no-explicit-any
    off(event, listener) {
        if (notImplementedEvents.includes(event)) {
            warnNotImplemented(`process.off("${event}")`);
            super.off(event, listener);
        }
        else if (event.startsWith("SIG")) {
            if (event === "SIGBREAK" && Deno.build.os !== "windows") {
                // Ignores SIGBREAK if the platform is not windows.
            }
            else if (event === "SIGTERM" && Deno.build.os === "windows") {
                // Ignores SIGTERM on windows.
            }
            else {
                Deno.removeSignalListener(event, listener);
            }
        }
        else {
            super.off(event, listener);
        }
        return this;
    }
    // deno-lint-ignore no-explicit-any
    emit(event, ...args) {
        if (event.startsWith("SIG")) {
            if (event === "SIGBREAK" && Deno.build.os !== "windows") {
                // Ignores SIGBREAK if the platform is not windows.
            }
            else {
                Deno.kill(Deno.pid, event);
            }
        }
        else {
            return super.emit(event, ...args);
        }
        return true;
    }
    prependListener(event, 
    // deno-lint-ignore no-explicit-any
    listener) {
        if (notImplementedEvents.includes(event)) {
            warnNotImplemented(`process.prependListener("${event}")`);
            super.prependListener(event, listener);
        }
        else if (event.startsWith("SIG")) {
            if (event === "SIGBREAK" && Deno.build.os !== "windows") {
                // Ignores SIGBREAK if the platform is not windows.
            }
            else {
                Deno.addSignalListener(event, listener);
            }
        }
        else {
            super.prependListener(event, listener);
        }
        return this;
    }
    addListener(event, 
    // deno-lint-ignore no-explicit-any
    listener) {
        if (notImplementedEvents.includes(event)) {
            warnNotImplemented(`process.addListener("${event}")`);
        }
        return this.on(event, listener);
    }
    removeListener(event, 
    // deno-lint-ignore no-explicit-any
    listener) {
        if (notImplementedEvents.includes(event)) {
            warnNotImplemented(`process.removeListener("${event}")`);
        }
        return this.off(event, listener);
    }
    binding(name) {
        return getBinding(name);
    }
    /** https://nodejs.org/api/process.html#processumaskmask */
    umask() {
        // Always return the system default umask value.
        // We don't use Deno.umask here because it has a race
        // condition bug.
        // See https://github.com/denoland/deno_std/issues/1893#issuecomment-1032897779
        return 0o22;
    }
    /** This method is removed on Windows */
    getgid() {
        return Deno.gid();
    }
    /** This method is removed on Windows */
    getuid() {
        return Deno.uid();
    }
    /** https://nodejs.org/api/process.html#processexecpath */
    get execPath() {
        if (execPath) {
            return execPath;
        }
        execPath = Deno.execPath();
        return execPath;
    }
    set execPath(path) {
        execPath = path;
    }
    /** https://nodejs.org/api/process.html#processuptime */
    uptime() {
        return (Date.now() - __classPrivateFieldGet(this, _Process_startTime, "f")) / 1000;
    }
    /** https://nodejs.org/api/process.html#processallowednodeenvironmentflags */
    get allowedNodeEnvironmentFlags() {
        return __classPrivateFieldGet(this, _Process_allowedFlags, "f");
    }
}
_Process_startTime = new WeakMap(), _Process_allowedFlags = new WeakMap();
if (Deno.build.os === "windows") {
    delete Process.prototype.getgid;
    delete Process.prototype.getuid;
}
/** https://nodejs.org/api/process.html#process_process */
const process = new Process();
Object.defineProperty(process, Symbol.toStringTag, {
    enumerable: false,
    writable: true,
    configurable: false,
    value: "process",
});
addReadOnlyProcessAlias("noDeprecation", "--no-deprecation");
addReadOnlyProcessAlias("throwDeprecation", "--throw-deprecation");
export const removeListener = process.removeListener;
export const removeAllListeners = process.removeAllListeners;
export default process;
//TODO(Soremwar)
//Remove on 1.0
//Kept for backwards compatibility with std
export { process };

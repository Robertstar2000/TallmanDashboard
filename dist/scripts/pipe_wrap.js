// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
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
var _Pipe_instances, _a, _Pipe_pendingInstances, _Pipe_address, _Pipe_backlog, _Pipe_listener, _Pipe_connections, _Pipe_closed, _Pipe_acceptBackoffDelay, _Pipe_acceptBackoff, _Pipe_accept;
// This module ports:
// - https://github.com/nodejs/node/blob/master/src/pipe_wrap.cc
// - https://github.com/nodejs/node/blob/master/src/pipe_wrap.h
import { notImplemented } from "../_utils.ts";
import { unreachable } from "../../_util/asserts.ts";
import { ConnectionWrap } from "./connection_wrap.ts";
import { AsyncWrap, providerType } from "./async_wrap.ts";
import { LibuvStreamWrap } from "./stream_wrap.ts";
import { codeMap } from "./uv.ts";
import { delay } from "../../async/mod.ts";
import { kStreamBaseField } from "./stream_wrap.ts";
import { ceilPowOf2, INITIAL_ACCEPT_BACKOFF_DELAY, MAX_ACCEPT_BACKOFF_DELAY, } from "./_listen.ts";
import { isWindows } from "../../_util/os.ts";
import { fs } from "./constants.ts";
export var socketType;
(function (socketType) {
    socketType[socketType["SOCKET"] = 0] = "SOCKET";
    socketType[socketType["SERVER"] = 1] = "SERVER";
    socketType[socketType["IPC"] = 2] = "IPC";
})(socketType || (socketType = {}));
export class Pipe extends ConnectionWrap {
    constructor(type, conn) {
        let provider;
        let ipc;
        switch (type) {
            case socketType.SOCKET: {
                provider = providerType.PIPEWRAP;
                ipc = false;
                break;
            }
            case socketType.SERVER: {
                provider = providerType.PIPESERVERWRAP;
                ipc = false;
                break;
            }
            case socketType.IPC: {
                provider = providerType.PIPEWRAP;
                ipc = true;
                break;
            }
            default: {
                unreachable();
            }
        }
        super(provider, conn);
        _Pipe_instances.add(this);
        this.reading = false;
        // REF: https://github.com/nodejs/node/blob/master/deps/uv/src/win/pipe.c#L48
        _Pipe_pendingInstances.set(this, 4);
        _Pipe_address.set(this, void 0);
        _Pipe_backlog.set(this, void 0);
        _Pipe_listener.set(this, void 0);
        _Pipe_connections.set(this, 0);
        _Pipe_closed.set(this, false);
        _Pipe_acceptBackoffDelay.set(this, void 0);
        this.ipc = ipc;
        if (conn && provider === providerType.PIPEWRAP) {
            const localAddr = conn.localAddr;
            __classPrivateFieldSet(this, _Pipe_address, localAddr.path, "f");
        }
    }
    open(_fd) {
        // REF: https://github.com/denoland/deno/issues/6529
        notImplemented("Pipe.prototype.open");
    }
    /**
     * Bind to a Unix domain or Windows named pipe.
     * @param name Unix domain or Windows named pipe the server should listen to.
     * @return An error status code.
     */
    bind(name) {
        // Deno doesn't currently separate bind from connect. For now we noop under
        // the assumption we will connect shortly.
        // REF: https://doc.deno.land/deno/unstable/~/Deno.connect
        __classPrivateFieldSet(this, _Pipe_address, name, "f");
        return 0;
    }
    /**
     * Connect to a Unix domain or Windows named pipe.
     * @param req A PipeConnectWrap instance.
     * @param address Unix domain or Windows named pipe the server should connect to.
     * @return An error status code.
     */
    connect(req, address) {
        if (isWindows) {
            // REF: https://github.com/denoland/deno/issues/10244
            notImplemented("Pipe.prototype.connect - Windows");
        }
        const connectOptions = {
            path: address,
            transport: "unix",
        };
        Deno.connect(connectOptions).then((conn) => {
            const localAddr = conn.localAddr;
            __classPrivateFieldSet(this, _Pipe_address, req.address = localAddr.path, "f");
            this[kStreamBaseField] = conn;
            try {
                this.afterConnect(req, 0);
            }
            catch (_b) {
                // swallow callback errors.
            }
        }, (e) => {
            // TODO(cmorten): correct mapping of connection error to status code.
            let code;
            if (e instanceof Deno.errors.NotFound) {
                code = codeMap.get("ENOENT");
            }
            else if (e instanceof Deno.errors.PermissionDenied) {
                code = codeMap.get("EACCES");
            }
            else {
                code = codeMap.get("ECONNREFUSED");
            }
            try {
                this.afterConnect(req, code);
            }
            catch (_b) {
                // swallow callback errors.
            }
        });
        return 0;
    }
    /**
     * Listen for new connections.
     * @param backlog The maximum length of the queue of pending connections.
     * @return An error status code.
     */
    listen(backlog) {
        if (isWindows) {
            // REF: https://github.com/denoland/deno/issues/10244
            notImplemented("Pipe.prototype.listen - Windows");
        }
        __classPrivateFieldSet(this, _Pipe_backlog, isWindows
            ? __classPrivateFieldGet(this, _Pipe_pendingInstances, "f")
            : ceilPowOf2(backlog + 1), "f");
        const listenOptions = {
            path: __classPrivateFieldGet(this, _Pipe_address, "f"),
            transport: "unix",
        };
        let listener;
        try {
            listener = Deno.listen(listenOptions);
        }
        catch (e) {
            if (e instanceof Deno.errors.AddrInUse) {
                return codeMap.get("EADDRINUSE");
            }
            else if (e instanceof Deno.errors.AddrNotAvailable) {
                return codeMap.get("EADDRNOTAVAIL");
            }
            // TODO(cmorten): map errors to appropriate error codes.
            return codeMap.get("UNKNOWN");
        }
        const address = listener.addr;
        __classPrivateFieldSet(this, _Pipe_address, address.path, "f");
        __classPrivateFieldSet(this, _Pipe_listener, listener, "f");
        __classPrivateFieldGet(this, _Pipe_instances, "m", _Pipe_accept).call(this);
        return 0;
    }
    ref() {
        if (__classPrivateFieldGet(this, _Pipe_listener, "f")) {
            __classPrivateFieldGet(this, _Pipe_listener, "f").ref();
        }
    }
    unref() {
        if (__classPrivateFieldGet(this, _Pipe_listener, "f")) {
            __classPrivateFieldGet(this, _Pipe_listener, "f").unref();
        }
    }
    /**
     * Set the number of pending pipe instance handles when the pipe server is
     * waiting for connections. This setting applies to Windows only.
     * @param instances Number of pending pipe instances.
     */
    setPendingInstances(instances) {
        __classPrivateFieldSet(this, _Pipe_pendingInstances, instances, "f");
    }
    /**
     * Alters pipe permissions, allowing it to be accessed from processes run by
     * different users. Makes the pipe writable or readable by all users. Mode
     * can be `UV_WRITABLE`, `UV_READABLE` or `UV_WRITABLE | UV_READABLE`. This
     * function is blocking.
     * @param mode Pipe permissions mode.
     * @return An error status code.
     */
    fchmod(mode) {
        if (mode != constants.UV_READABLE &&
            mode != constants.UV_WRITABLE &&
            mode != (constants.UV_WRITABLE | constants.UV_READABLE)) {
            return codeMap.get("EINVAL");
        }
        let desired_mode = 0;
        if (mode & constants.UV_READABLE) {
            desired_mode |= fs.S_IRUSR | fs.S_IRGRP | fs.S_IROTH;
        }
        if (mode & constants.UV_WRITABLE) {
            desired_mode |= fs.S_IWUSR | fs.S_IWGRP | fs.S_IWOTH;
        }
        // TODO(cmorten): this will incorrectly throw on Windows
        // REF: https://github.com/denoland/deno/issues/4357
        try {
            Deno.chmodSync(__classPrivateFieldGet(this, _Pipe_address, "f"), desired_mode);
        }
        catch (_b) {
            // TODO(cmorten): map errors to appropriate error codes.
            return codeMap.get("UNKNOWN");
        }
        return 0;
    }
    /** Handle server closure. */
    _onClose() {
        __classPrivateFieldSet(this, _Pipe_closed, true, "f");
        this.reading = false;
        __classPrivateFieldSet(this, _Pipe_address, undefined, "f");
        __classPrivateFieldSet(this, _Pipe_backlog, undefined, "f");
        __classPrivateFieldSet(this, _Pipe_connections, 0, "f");
        __classPrivateFieldSet(this, _Pipe_acceptBackoffDelay, undefined, "f");
        if (this.provider === providerType.PIPESERVERWRAP) {
            try {
                __classPrivateFieldGet(this, _Pipe_listener, "f").close();
            }
            catch (_b) {
                // listener already closed
            }
        }
        return LibuvStreamWrap.prototype._onClose.call(this);
    }
}
_a = Pipe, _Pipe_pendingInstances = new WeakMap(), _Pipe_address = new WeakMap(), _Pipe_backlog = new WeakMap(), _Pipe_listener = new WeakMap(), _Pipe_connections = new WeakMap(), _Pipe_closed = new WeakMap(), _Pipe_acceptBackoffDelay = new WeakMap(), _Pipe_instances = new WeakSet(), _Pipe_acceptBackoff = function _Pipe_acceptBackoff() {
    return __awaiter(this, void 0, void 0, function* () {
        // Backoff after transient errors to allow time for the system to
        // recover, and avoid blocking up the event loop with a continuously
        // running loop.
        if (!__classPrivateFieldGet(this, _Pipe_acceptBackoffDelay, "f")) {
            __classPrivateFieldSet(this, _Pipe_acceptBackoffDelay, INITIAL_ACCEPT_BACKOFF_DELAY, "f");
        }
        else {
            __classPrivateFieldSet(this, _Pipe_acceptBackoffDelay, __classPrivateFieldGet(this, _Pipe_acceptBackoffDelay, "f") * 2, "f");
        }
        if (__classPrivateFieldGet(this, _Pipe_acceptBackoffDelay, "f") >= MAX_ACCEPT_BACKOFF_DELAY) {
            __classPrivateFieldSet(this, _Pipe_acceptBackoffDelay, MAX_ACCEPT_BACKOFF_DELAY, "f");
        }
        yield delay(__classPrivateFieldGet(this, _Pipe_acceptBackoffDelay, "f"));
        __classPrivateFieldGet(this, _Pipe_instances, "m", _Pipe_accept).call(this);
    });
}, _Pipe_accept = function _Pipe_accept() {
    return __awaiter(this, void 0, void 0, function* () {
        var _b;
        if (__classPrivateFieldGet(this, _Pipe_closed, "f")) {
            return;
        }
        if (__classPrivateFieldGet(this, _Pipe_connections, "f") > __classPrivateFieldGet(this, _Pipe_backlog, "f")) {
            __classPrivateFieldGet(this, _Pipe_instances, "m", _Pipe_acceptBackoff).call(this);
            return;
        }
        let connection;
        try {
            connection = yield __classPrivateFieldGet(this, _Pipe_listener, "f").accept();
        }
        catch (e) {
            if (e instanceof Deno.errors.BadResource && __classPrivateFieldGet(this, _Pipe_closed, "f")) {
                // Listener and server has closed.
                return;
            }
            try {
                // TODO(cmorten): map errors to appropriate error codes.
                this.onconnection(codeMap.get("UNKNOWN"), undefined);
            }
            catch (_c) {
                // swallow callback errors.
            }
            __classPrivateFieldGet(this, _Pipe_instances, "m", _Pipe_acceptBackoff).call(this);
            return;
        }
        // Reset the backoff delay upon successful accept.
        __classPrivateFieldSet(this, _Pipe_acceptBackoffDelay, undefined, "f");
        const connectionHandle = new _a(socketType.SOCKET, connection);
        __classPrivateFieldSet(this, _Pipe_connections, (_b = __classPrivateFieldGet(this, _Pipe_connections, "f"), _b++, _b), "f");
        try {
            this.onconnection(0, connectionHandle);
        }
        catch (_d) {
            // swallow callback errors.
        }
        return __classPrivateFieldGet(this, _Pipe_instances, "m", _Pipe_accept).call(this);
    });
};
export class PipeConnectWrap extends AsyncWrap {
    constructor() {
        super(providerType.PIPECONNECTWRAP);
    }
}
export var constants;
(function (constants) {
    constants[constants["SOCKET"] = 0] = "SOCKET";
    constants[constants["SERVER"] = 1] = "SERVER";
    constants[constants["IPC"] = 2] = "IPC";
    constants[constants["UV_READABLE"] = 1] = "UV_READABLE";
    constants[constants["UV_WRITABLE"] = 2] = "UV_WRITABLE";
})(constants || (constants = {}));

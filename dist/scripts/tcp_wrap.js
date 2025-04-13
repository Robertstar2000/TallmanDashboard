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
var _TCP_instances, _a, _TCP_address, _TCP_port, _TCP_remoteAddress, _TCP_remoteFamily, _TCP_remotePort, _TCP_backlog, _TCP_listener, _TCP_connections, _TCP_closed, _TCP_acceptBackoffDelay, _TCP_bind, _TCP_connect, _TCP_acceptBackoff, _TCP_accept, _b;
// This module ports:
// - https://github.com/nodejs/node/blob/master/src/tcp_wrap.cc
// - https://github.com/nodejs/node/blob/master/src/tcp_wrap.h
import { notImplemented } from "../_utils.ts";
import { unreachable } from "../../_util/asserts.ts";
import { ConnectionWrap } from "./connection_wrap.ts";
import { AsyncWrap, providerType } from "./async_wrap.ts";
import { LibuvStreamWrap } from "./stream_wrap.ts";
import { ownerSymbol } from "./symbols.ts";
import { codeMap } from "./uv.ts";
import { delay } from "../../async/mod.ts";
import { kStreamBaseField } from "./stream_wrap.ts";
import { isIP } from "../internal/net.ts";
import { ceilPowOf2, INITIAL_ACCEPT_BACKOFF_DELAY, MAX_ACCEPT_BACKOFF_DELAY, } from "./_listen.ts";
/** The type of TCP socket. */
var socketType;
(function (socketType) {
    socketType[socketType["SOCKET"] = 0] = "SOCKET";
    socketType[socketType["SERVER"] = 1] = "SERVER";
})(socketType || (socketType = {}));
export class TCPConnectWrap extends AsyncWrap {
    constructor() {
        super(providerType.TCPCONNECTWRAP);
    }
}
export var constants;
(function (constants) {
    constants[constants["SOCKET"] = 0] = "SOCKET";
    constants[constants["SERVER"] = 1] = "SERVER";
    constants[constants["UV_TCP_IPV6ONLY"] = 2] = "UV_TCP_IPV6ONLY";
})(constants || (constants = {}));
export class TCP extends ConnectionWrap {
    /**
     * Creates a new TCP class instance.
     * @param type The socket type.
     * @param conn Optional connection object to wrap.
     */
    constructor(type, conn) {
        let provider;
        switch (type) {
            case socketType.SOCKET: {
                provider = providerType.TCPWRAP;
                break;
            }
            case socketType.SERVER: {
                provider = providerType.TCPSERVERWRAP;
                break;
            }
            default: {
                unreachable();
            }
        }
        super(provider, conn);
        _TCP_instances.add(this);
        this[_b] = null;
        this.reading = false;
        _TCP_address.set(this, void 0);
        _TCP_port.set(this, void 0);
        _TCP_remoteAddress.set(this, void 0);
        _TCP_remoteFamily.set(this, void 0);
        _TCP_remotePort.set(this, void 0);
        _TCP_backlog.set(this, void 0);
        _TCP_listener.set(this, void 0);
        _TCP_connections.set(this, 0);
        _TCP_closed.set(this, false);
        _TCP_acceptBackoffDelay.set(this, void 0);
        // TODO(cmorten): the handling of new connections and construction feels
        // a little off. Suspect duplicating in some fashion.
        if (conn && provider === providerType.TCPWRAP) {
            const localAddr = conn.localAddr;
            __classPrivateFieldSet(this, _TCP_address, localAddr.hostname, "f");
            __classPrivateFieldSet(this, _TCP_port, localAddr.port, "f");
            const remoteAddr = conn.remoteAddr;
            __classPrivateFieldSet(this, _TCP_remoteAddress, remoteAddr.hostname, "f");
            __classPrivateFieldSet(this, _TCP_remotePort, remoteAddr.port, "f");
            __classPrivateFieldSet(this, _TCP_remoteFamily, isIP(remoteAddr.hostname), "f");
        }
    }
    /**
     * Opens a file descriptor.
     * @param fd The file descriptor to open.
     * @return An error status code.
     */
    open(_fd) {
        // REF: https://github.com/denoland/deno/issues/6529
        notImplemented("TCP.prototype.open");
    }
    /**
     * Bind to an IPv4 address.
     * @param address The hostname to bind to.
     * @param port The port to bind to
     * @return An error status code.
     */
    bind(address, port) {
        return __classPrivateFieldGet(this, _TCP_instances, "m", _TCP_bind).call(this, address, port, 0);
    }
    /**
     * Bind to an IPv6 address.
     * @param address The hostname to bind to.
     * @param port The port to bind to
     * @return An error status code.
     */
    bind6(address, port, flags) {
        return __classPrivateFieldGet(this, _TCP_instances, "m", _TCP_bind).call(this, address, port, flags);
    }
    /**
     * Connect to an IPv4 address.
     * @param req A TCPConnectWrap instance.
     * @param address The hostname to connect to.
     * @param port The port to connect to.
     * @return An error status code.
     */
    connect(req, address, port) {
        return __classPrivateFieldGet(this, _TCP_instances, "m", _TCP_connect).call(this, req, address, port);
    }
    /**
     * Connect to an IPv6 address.
     * @param req A TCPConnectWrap instance.
     * @param address The hostname to connect to.
     * @param port The port to connect to.
     * @return An error status code.
     */
    connect6(req, address, port) {
        return __classPrivateFieldGet(this, _TCP_instances, "m", _TCP_connect).call(this, req, address, port);
    }
    /**
     * Listen for new connections.
     * @param backlog The maximum length of the queue of pending connections.
     * @return An error status code.
     */
    listen(backlog) {
        __classPrivateFieldSet(this, _TCP_backlog, ceilPowOf2(backlog + 1), "f");
        const listenOptions = {
            hostname: __classPrivateFieldGet(this, _TCP_address, "f"),
            port: __classPrivateFieldGet(this, _TCP_port, "f"),
            transport: "tcp",
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
        __classPrivateFieldSet(this, _TCP_address, address.hostname, "f");
        __classPrivateFieldSet(this, _TCP_port, address.port, "f");
        __classPrivateFieldSet(this, _TCP_listener, listener, "f");
        __classPrivateFieldGet(this, _TCP_instances, "m", _TCP_accept).call(this);
        return 0;
    }
    ref() {
        if (__classPrivateFieldGet(this, _TCP_listener, "f")) {
            __classPrivateFieldGet(this, _TCP_listener, "f").ref();
        }
        if (this[kStreamBaseField]) {
            this[kStreamBaseField].ref();
        }
    }
    unref() {
        if (__classPrivateFieldGet(this, _TCP_listener, "f")) {
            __classPrivateFieldGet(this, _TCP_listener, "f").unref();
        }
        if (this[kStreamBaseField]) {
            this[kStreamBaseField].unref();
        }
    }
    /**
     * Populates the provided object with local address entries.
     * @param sockname An object to add the local address entries to.
     * @return An error status code.
     */
    getsockname(sockname) {
        if (typeof __classPrivateFieldGet(this, _TCP_address, "f") === "undefined" ||
            typeof __classPrivateFieldGet(this, _TCP_port, "f") === "undefined") {
            return codeMap.get("EADDRNOTAVAIL");
        }
        sockname.address = __classPrivateFieldGet(this, _TCP_address, "f");
        sockname.port = __classPrivateFieldGet(this, _TCP_port, "f");
        sockname.family = isIP(__classPrivateFieldGet(this, _TCP_address, "f"));
        return 0;
    }
    /**
     * Populates the provided object with remote address entries.
     * @param peername An object to add the remote address entries to.
     * @return An error status code.
     */
    getpeername(peername) {
        if (typeof __classPrivateFieldGet(this, _TCP_remoteAddress, "f") === "undefined" ||
            typeof __classPrivateFieldGet(this, _TCP_remotePort, "f") === "undefined") {
            return codeMap.get("EADDRNOTAVAIL");
        }
        peername.address = __classPrivateFieldGet(this, _TCP_remoteAddress, "f");
        peername.port = __classPrivateFieldGet(this, _TCP_remotePort, "f");
        peername.family = __classPrivateFieldGet(this, _TCP_remoteFamily, "f");
        return 0;
    }
    /**
     * @param noDelay
     * @return An error status code.
     */
    setNoDelay(_noDelay) {
        // TODO(bnoordhuis) https://github.com/denoland/deno/pull/13103
        return 0;
    }
    /**
     * @param enable
     * @param initialDelay
     * @return An error status code.
     */
    setKeepAlive(_enable, _initialDelay) {
        // TODO(bnoordhuis) https://github.com/denoland/deno/pull/13103
        return 0;
    }
    /**
     * Windows only.
     *
     * Deprecated by Node.
     * REF: https://github.com/nodejs/node/blob/master/lib/net.js#L1731
     *
     * @param enable
     * @return An error status code.
     * @deprecated
     */
    setSimultaneousAccepts(_enable) {
        // Low priority to implement owing to it being deprecated in Node.
        notImplemented("TCP.prototype.setSimultaneousAccepts");
    }
    /** Handle server closure. */
    _onClose() {
        __classPrivateFieldSet(this, _TCP_closed, true, "f");
        this.reading = false;
        __classPrivateFieldSet(this, _TCP_address, undefined, "f");
        __classPrivateFieldSet(this, _TCP_port, undefined, "f");
        __classPrivateFieldSet(this, _TCP_remoteAddress, undefined, "f");
        __classPrivateFieldSet(this, _TCP_remoteFamily, undefined, "f");
        __classPrivateFieldSet(this, _TCP_remotePort, undefined, "f");
        __classPrivateFieldSet(this, _TCP_backlog, undefined, "f");
        __classPrivateFieldSet(this, _TCP_connections, 0, "f");
        __classPrivateFieldSet(this, _TCP_acceptBackoffDelay, undefined, "f");
        if (this.provider === providerType.TCPSERVERWRAP) {
            try {
                __classPrivateFieldGet(this, _TCP_listener, "f").close();
            }
            catch (_c) {
                // listener already closed
            }
        }
        return LibuvStreamWrap.prototype._onClose.call(this);
    }
}
_a = TCP, _TCP_address = new WeakMap(), _TCP_port = new WeakMap(), _TCP_remoteAddress = new WeakMap(), _TCP_remoteFamily = new WeakMap(), _TCP_remotePort = new WeakMap(), _TCP_backlog = new WeakMap(), _TCP_listener = new WeakMap(), _TCP_connections = new WeakMap(), _TCP_closed = new WeakMap(), _TCP_acceptBackoffDelay = new WeakMap(), _TCP_instances = new WeakSet(), _b = ownerSymbol, _TCP_bind = function _TCP_bind(address, port, _flags) {
    // Deno doesn't currently separate bind from connect etc.
    // REF:
    // - https://doc.deno.land/deno/stable/~/Deno.connect
    // - https://doc.deno.land/deno/stable/~/Deno.listen
    //
    // This also means we won't be connecting from the specified local address
    // and port as providing these is not an option in Deno.
    // REF:
    // - https://doc.deno.land/deno/stable/~/Deno.ConnectOptions
    // - https://doc.deno.land/deno/stable/~/Deno.ListenOptions
    __classPrivateFieldSet(this, _TCP_address, address, "f");
    __classPrivateFieldSet(this, _TCP_port, port, "f");
    return 0;
}, _TCP_connect = function _TCP_connect(req, address, port) {
    __classPrivateFieldSet(this, _TCP_remoteAddress, address, "f");
    __classPrivateFieldSet(this, _TCP_remotePort, port, "f");
    __classPrivateFieldSet(this, _TCP_remoteFamily, isIP(address), "f");
    const connectOptions = {
        hostname: address,
        port,
        transport: "tcp",
    };
    Deno.connect(connectOptions).then((conn) => {
        // Incorrect / backwards, but correcting the local address and port with
        // what was actually used given we can't actually specify these in Deno.
        const localAddr = conn.localAddr;
        __classPrivateFieldSet(this, _TCP_address, req.localAddress = localAddr.hostname, "f");
        __classPrivateFieldSet(this, _TCP_port, req.localPort = localAddr.port, "f");
        this[kStreamBaseField] = conn;
        try {
            this.afterConnect(req, 0);
        }
        catch (_c) {
            // swallow callback errors.
        }
    }, () => {
        try {
            // TODO(cmorten): correct mapping of connection error to status code.
            this.afterConnect(req, codeMap.get("ECONNREFUSED"));
        }
        catch (_c) {
            // swallow callback errors.
        }
    });
    return 0;
}, _TCP_acceptBackoff = function _TCP_acceptBackoff() {
    return __awaiter(this, void 0, void 0, function* () {
        // Backoff after transient errors to allow time for the system to
        // recover, and avoid blocking up the event loop with a continuously
        // running loop.
        if (!__classPrivateFieldGet(this, _TCP_acceptBackoffDelay, "f")) {
            __classPrivateFieldSet(this, _TCP_acceptBackoffDelay, INITIAL_ACCEPT_BACKOFF_DELAY, "f");
        }
        else {
            __classPrivateFieldSet(this, _TCP_acceptBackoffDelay, __classPrivateFieldGet(this, _TCP_acceptBackoffDelay, "f") * 2, "f");
        }
        if (__classPrivateFieldGet(this, _TCP_acceptBackoffDelay, "f") >= MAX_ACCEPT_BACKOFF_DELAY) {
            __classPrivateFieldSet(this, _TCP_acceptBackoffDelay, MAX_ACCEPT_BACKOFF_DELAY, "f");
        }
        yield delay(__classPrivateFieldGet(this, _TCP_acceptBackoffDelay, "f"));
        __classPrivateFieldGet(this, _TCP_instances, "m", _TCP_accept).call(this);
    });
}, _TCP_accept = function _TCP_accept() {
    return __awaiter(this, void 0, void 0, function* () {
        var _c;
        if (__classPrivateFieldGet(this, _TCP_closed, "f")) {
            return;
        }
        if (__classPrivateFieldGet(this, _TCP_connections, "f") > __classPrivateFieldGet(this, _TCP_backlog, "f")) {
            __classPrivateFieldGet(this, _TCP_instances, "m", _TCP_acceptBackoff).call(this);
            return;
        }
        let connection;
        try {
            connection = yield __classPrivateFieldGet(this, _TCP_listener, "f").accept();
        }
        catch (e) {
            if (e instanceof Deno.errors.BadResource && __classPrivateFieldGet(this, _TCP_closed, "f")) {
                // Listener and server has closed.
                return;
            }
            try {
                // TODO(cmorten): map errors to appropriate error codes.
                this.onconnection(codeMap.get("UNKNOWN"), undefined);
            }
            catch (_d) {
                // swallow callback errors.
            }
            __classPrivateFieldGet(this, _TCP_instances, "m", _TCP_acceptBackoff).call(this);
            return;
        }
        // Reset the backoff delay upon successful accept.
        __classPrivateFieldSet(this, _TCP_acceptBackoffDelay, undefined, "f");
        const connectionHandle = new _a(socketType.SOCKET, connection);
        __classPrivateFieldSet(this, _TCP_connections, (_c = __classPrivateFieldGet(this, _TCP_connections, "f"), _c++, _c), "f");
        try {
            this.onconnection(0, connectionHandle);
        }
        catch (_e) {
            // swallow callback errors.
        }
        return __classPrivateFieldGet(this, _TCP_instances, "m", _TCP_accept).call(this);
    });
};

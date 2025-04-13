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
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _a, _b;
var _UDP_instances, _UDP_address, _UDP_family, _UDP_port, _UDP_remoteAddress, _UDP_remoteFamily, _UDP_remotePort, _UDP_listener, _UDP_receiving, _UDP_recvBufferSize, _UDP_sendBufferSize, _UDP_doBind, _UDP_doConnect, _UDP_doSend, _UDP_receive, _c;
import { AsyncWrap, providerType } from "./async_wrap.ts";
import { HandleWrap } from "./handle_wrap.ts";
import { ownerSymbol } from "./symbols.ts";
import { codeMap, errorMap } from "./uv.ts";
import { notImplemented } from "../_utils.ts";
import { Buffer } from "../buffer.ts";
import { isIP } from "../internal/net.ts";
import { isLinux, isWindows } from "../../_util/os.ts";
// @ts-ignore Deno[Deno.internal] is used on purpose here
const DenoListenDatagram = ((_b = (_a = Deno[Deno.internal]) === null || _a === void 0 ? void 0 : _a.nodeUnstable) === null || _b === void 0 ? void 0 : _b.listenDatagram) ||
    Deno.listenDatagram;
const AF_INET = 2;
const AF_INET6 = 10;
const UDP_DGRAM_MAXSIZE = 64 * 1024;
export class SendWrap extends AsyncWrap {
    constructor() {
        super(providerType.UDPSENDWRAP);
    }
}
export class UDP extends HandleWrap {
    constructor() {
        super(providerType.UDPWRAP);
        _UDP_instances.add(this);
        this[_c] = null;
        _UDP_address.set(this, void 0);
        _UDP_family.set(this, void 0);
        _UDP_port.set(this, void 0);
        _UDP_remoteAddress.set(this, void 0);
        _UDP_remoteFamily.set(this, void 0);
        _UDP_remotePort.set(this, void 0);
        _UDP_listener.set(this, void 0);
        _UDP_receiving.set(this, false);
        _UDP_recvBufferSize.set(this, UDP_DGRAM_MAXSIZE);
        _UDP_sendBufferSize.set(this, UDP_DGRAM_MAXSIZE);
    }
    addMembership(_multicastAddress, _interfaceAddress) {
        notImplemented("udp.UDP.prototype.addMembership");
    }
    addSourceSpecificMembership(_sourceAddress, _groupAddress, _interfaceAddress) {
        notImplemented("udp.UDP.prototype.addSourceSpecificMembership");
    }
    /**
     * Bind to an IPv4 address.
     * @param ip The hostname to bind to.
     * @param port The port to bind to
     * @return An error status code.
     */
    bind(ip, port, flags) {
        return __classPrivateFieldGet(this, _UDP_instances, "m", _UDP_doBind).call(this, ip, port, flags, AF_INET);
    }
    /**
     * Bind to an IPv6 address.
     * @param ip The hostname to bind to.
     * @param port The port to bind to
     * @return An error status code.
     */
    bind6(ip, port, flags) {
        return __classPrivateFieldGet(this, _UDP_instances, "m", _UDP_doBind).call(this, ip, port, flags, AF_INET6);
    }
    bufferSize(size, buffer, ctx) {
        let err;
        if (size > UDP_DGRAM_MAXSIZE) {
            err = "EINVAL";
        }
        else if (!__classPrivateFieldGet(this, _UDP_address, "f")) {
            err = isWindows ? "ENOTSOCK" : "EBADF";
        }
        if (err) {
            ctx.errno = codeMap.get(err);
            ctx.code = err;
            ctx.message = errorMap.get(ctx.errno)[1];
            ctx.syscall = buffer ? "uv_recv_buffer_size" : "uv_send_buffer_size";
            return;
        }
        if (size !== 0) {
            size = isLinux ? size * 2 : size;
            if (buffer) {
                return (__classPrivateFieldSet(this, _UDP_recvBufferSize, size, "f"));
            }
            return (__classPrivateFieldSet(this, _UDP_sendBufferSize, size, "f"));
        }
        return buffer ? __classPrivateFieldGet(this, _UDP_recvBufferSize, "f") : __classPrivateFieldGet(this, _UDP_sendBufferSize, "f");
    }
    connect(ip, port) {
        return __classPrivateFieldGet(this, _UDP_instances, "m", _UDP_doConnect).call(this, ip, port, AF_INET);
    }
    connect6(ip, port) {
        return __classPrivateFieldGet(this, _UDP_instances, "m", _UDP_doConnect).call(this, ip, port, AF_INET6);
    }
    disconnect() {
        __classPrivateFieldSet(this, _UDP_remoteAddress, undefined, "f");
        __classPrivateFieldSet(this, _UDP_remotePort, undefined, "f");
        __classPrivateFieldSet(this, _UDP_remoteFamily, undefined, "f");
        return 0;
    }
    dropMembership(_multicastAddress, _interfaceAddress) {
        notImplemented("udp.UDP.prototype.dropMembership");
    }
    dropSourceSpecificMembership(_sourceAddress, _groupAddress, _interfaceAddress) {
        notImplemented("udp.UDP.prototype.dropSourceSpecificMembership");
    }
    /**
     * Populates the provided object with remote address entries.
     * @param peername An object to add the remote address entries to.
     * @return An error status code.
     */
    getpeername(peername) {
        if (__classPrivateFieldGet(this, _UDP_remoteAddress, "f") === undefined) {
            return codeMap.get("EBADF");
        }
        peername.address = __classPrivateFieldGet(this, _UDP_remoteAddress, "f");
        peername.port = __classPrivateFieldGet(this, _UDP_remotePort, "f");
        peername.family = __classPrivateFieldGet(this, _UDP_remoteFamily, "f");
        return 0;
    }
    /**
     * Populates the provided object with local address entries.
     * @param sockname An object to add the local address entries to.
     * @return An error status code.
     */
    getsockname(sockname) {
        if (__classPrivateFieldGet(this, _UDP_address, "f") === undefined) {
            return codeMap.get("EBADF");
        }
        sockname.address = __classPrivateFieldGet(this, _UDP_address, "f");
        sockname.port = __classPrivateFieldGet(this, _UDP_port, "f");
        sockname.family = __classPrivateFieldGet(this, _UDP_family, "f");
        return 0;
    }
    /**
     * Opens a file descriptor.
     * @param fd The file descriptor to open.
     * @return An error status code.
     */
    open(_fd) {
        // REF: https://github.com/denoland/deno/issues/6529
        notImplemented("udp.UDP.prototype.open");
    }
    /**
     * Start receiving on the connection.
     * @return An error status code.
     */
    recvStart() {
        if (!__classPrivateFieldGet(this, _UDP_receiving, "f")) {
            __classPrivateFieldSet(this, _UDP_receiving, true, "f");
            __classPrivateFieldGet(this, _UDP_instances, "m", _UDP_receive).call(this);
        }
        return 0;
    }
    /**
     * Stop receiving on the connection.
     * @return An error status code.
     */
    recvStop() {
        __classPrivateFieldSet(this, _UDP_receiving, false, "f");
        return 0;
    }
    ref() {
        notImplemented("udp.UDP.prototype.ref");
    }
    send(req, bufs, count, ...args) {
        return __classPrivateFieldGet(this, _UDP_instances, "m", _UDP_doSend).call(this, req, bufs, count, args, AF_INET);
    }
    send6(req, bufs, count, ...args) {
        return __classPrivateFieldGet(this, _UDP_instances, "m", _UDP_doSend).call(this, req, bufs, count, args, AF_INET6);
    }
    setBroadcast(_bool) {
        notImplemented("udp.UDP.prototype.setBroadcast");
    }
    setMulticastInterface(_interfaceAddress) {
        notImplemented("udp.UDP.prototype.setMulticastInterface");
    }
    setMulticastLoopback(_bool) {
        notImplemented("udp.UDP.prototype.setMulticastLoopback");
    }
    setMulticastTTL(_ttl) {
        notImplemented("udp.UDP.prototype.setMulticastTTL");
    }
    setTTL(_ttl) {
        notImplemented("udp.UDP.prototype.setTTL");
    }
    unref() {
        notImplemented("udp.UDP.prototype.unref");
    }
    /** Handle socket closure. */
    _onClose() {
        __classPrivateFieldSet(this, _UDP_receiving, false, "f");
        __classPrivateFieldSet(this, _UDP_address, undefined, "f");
        __classPrivateFieldSet(this, _UDP_port, undefined, "f");
        __classPrivateFieldSet(this, _UDP_family, undefined, "f");
        try {
            __classPrivateFieldGet(this, _UDP_listener, "f").close();
        }
        catch (_a) {
            // listener already closed
        }
        __classPrivateFieldSet(this, _UDP_listener, undefined, "f");
        return 0;
    }
}
_UDP_address = new WeakMap(), _UDP_family = new WeakMap(), _UDP_port = new WeakMap(), _UDP_remoteAddress = new WeakMap(), _UDP_remoteFamily = new WeakMap(), _UDP_remotePort = new WeakMap(), _UDP_listener = new WeakMap(), _UDP_receiving = new WeakMap(), _UDP_recvBufferSize = new WeakMap(), _UDP_sendBufferSize = new WeakMap(), _UDP_instances = new WeakSet(), _c = ownerSymbol, _UDP_doBind = function _UDP_doBind(ip, port, _flags, family) {
    // TODO(cmorten): use flags to inform socket reuse etc.
    const listenOptions = {
        port,
        hostname: ip,
        transport: "udp",
    };
    let listener;
    try {
        listener = DenoListenDatagram(listenOptions);
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
    __classPrivateFieldSet(this, _UDP_address, address.hostname, "f");
    __classPrivateFieldSet(this, _UDP_port, address.port, "f");
    __classPrivateFieldSet(this, _UDP_family, family === AF_INET6 ? "IPv6" : "IPv4", "f");
    __classPrivateFieldSet(this, _UDP_listener, listener, "f");
    return 0;
}, _UDP_doConnect = function _UDP_doConnect(ip, port, family) {
    __classPrivateFieldSet(this, _UDP_remoteAddress, ip, "f");
    __classPrivateFieldSet(this, _UDP_remotePort, port, "f");
    __classPrivateFieldSet(this, _UDP_remoteFamily, family === AF_INET6
        ? "IPv6"
        : "IPv4", "f");
    return 0;
}, _UDP_doSend = function _UDP_doSend(req, bufs, _count, args, _family) {
    let hasCallback;
    if (args.length === 3) {
        __classPrivateFieldSet(this, _UDP_remotePort, args[0], "f");
        __classPrivateFieldSet(this, _UDP_remoteAddress, args[1], "f");
        hasCallback = args[2];
    }
    else {
        hasCallback = args[0];
    }
    const addr = {
        hostname: __classPrivateFieldGet(this, _UDP_remoteAddress, "f"),
        port: __classPrivateFieldGet(this, _UDP_remotePort, "f"),
        transport: "udp",
    };
    // Deno.DatagramConn.prototype.send accepts only one Uint8Array
    const payload = new Uint8Array(Buffer.concat(bufs.map((buf) => {
        if (typeof buf === "string") {
            return Buffer.from(buf);
        }
        return Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength);
    })));
    (() => __awaiter(this, void 0, void 0, function* () {
        let sent;
        let err = null;
        try {
            sent = yield __classPrivateFieldGet(this, _UDP_listener, "f").send(payload, addr);
        }
        catch (e) {
            // TODO(cmorten): map errors to appropriate error codes.
            if (e instanceof Deno.errors.BadResource) {
                err = codeMap.get("EBADF");
            }
            else if (e instanceof Error &&
                e.message.match(/os error (40|90|10040)/)) {
                err = codeMap.get("EMSGSIZE");
            }
            else {
                err = codeMap.get("UNKNOWN");
            }
            sent = 0;
        }
        if (hasCallback) {
            try {
                req.oncomplete(err, sent);
            }
            catch (_a) {
                // swallow callback errors
            }
        }
    }))();
    return 0;
}, _UDP_receive = function _UDP_receive() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!__classPrivateFieldGet(this, _UDP_receiving, "f")) {
            return;
        }
        const p = new Uint8Array(__classPrivateFieldGet(this, _UDP_recvBufferSize, "f"));
        let buf;
        let remoteAddr;
        let nread;
        try {
            [buf, remoteAddr] = (yield __classPrivateFieldGet(this, _UDP_listener, "f").receive(p));
            nread = buf.length;
        }
        catch (e) {
            // TODO(cmorten): map errors to appropriate error codes.
            if (e instanceof Deno.errors.Interrupted ||
                e instanceof Deno.errors.BadResource) {
                nread = 0;
            }
            else {
                nread = codeMap.get("UNKNOWN");
            }
            buf = new Uint8Array(0);
            remoteAddr = null;
        }
        nread !== null && nread !== void 0 ? nread : (nread = 0);
        const rinfo = remoteAddr
            ? {
                address: remoteAddr.hostname,
                port: remoteAddr.port,
                family: isIP(remoteAddr.hostname) === 6
                    ? "IPv6"
                    : "IPv4",
            }
            : undefined;
        try {
            this.onmessage(nread, this, Buffer.from(buf), rinfo);
        }
        catch (_a) {
            // swallow callback errors.
        }
        __classPrivateFieldGet(this, _UDP_instances, "m", _UDP_receive).call(this);
    });
};

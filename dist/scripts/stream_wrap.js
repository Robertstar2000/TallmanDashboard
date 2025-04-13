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
var _LibuvStreamWrap_instances, _LibuvStreamWrap_reading, _LibuvStreamWrap_attachToObject, _LibuvStreamWrap_read, _LibuvStreamWrap_write;
// This module ports:
// - https://github.com/nodejs/node/blob/master/src/stream_base-inl.h
// - https://github.com/nodejs/node/blob/master/src/stream_base.h
// - https://github.com/nodejs/node/blob/master/src/stream_base.cc
// - https://github.com/nodejs/node/blob/master/src/stream_wrap.h
// - https://github.com/nodejs/node/blob/master/src/stream_wrap.cc
import { Buffer } from "../buffer.ts";
import { notImplemented } from "../_utils.ts";
import { HandleWrap } from "./handle_wrap.ts";
import { AsyncWrap, providerType } from "./async_wrap.ts";
import { codeMap } from "./uv.ts";
import { writeAll } from "../../streams/write_all.ts";
var StreamBaseStateFields;
(function (StreamBaseStateFields) {
    StreamBaseStateFields[StreamBaseStateFields["kReadBytesOrError"] = 0] = "kReadBytesOrError";
    StreamBaseStateFields[StreamBaseStateFields["kArrayBufferOffset"] = 1] = "kArrayBufferOffset";
    StreamBaseStateFields[StreamBaseStateFields["kBytesWritten"] = 2] = "kBytesWritten";
    StreamBaseStateFields[StreamBaseStateFields["kLastWriteWasAsync"] = 3] = "kLastWriteWasAsync";
    StreamBaseStateFields[StreamBaseStateFields["kNumStreamBaseStateFields"] = 4] = "kNumStreamBaseStateFields";
})(StreamBaseStateFields || (StreamBaseStateFields = {}));
export const kReadBytesOrError = StreamBaseStateFields.kReadBytesOrError;
export const kArrayBufferOffset = StreamBaseStateFields.kArrayBufferOffset;
export const kBytesWritten = StreamBaseStateFields.kBytesWritten;
export const kLastWriteWasAsync = StreamBaseStateFields.kLastWriteWasAsync;
export const kNumStreamBaseStateFields = StreamBaseStateFields.kNumStreamBaseStateFields;
export const streamBaseState = new Uint8Array(5);
// This is Deno, it always will be async.
streamBaseState[kLastWriteWasAsync] = 1;
export class WriteWrap extends AsyncWrap {
    constructor() {
        super(providerType.WRITEWRAP);
    }
}
export class ShutdownWrap extends AsyncWrap {
    constructor() {
        super(providerType.SHUTDOWNWRAP);
    }
}
export const kStreamBaseField = Symbol("kStreamBaseField");
const SUGGESTED_SIZE = 64 * 1024;
export class LibuvStreamWrap extends HandleWrap {
    constructor(provider, stream) {
        super(provider);
        _LibuvStreamWrap_instances.add(this);
        _LibuvStreamWrap_reading.set(this, false);
        this.destroyed = false;
        this.writeQueueSize = 0;
        this.bytesRead = 0;
        this.bytesWritten = 0;
        __classPrivateFieldGet(this, _LibuvStreamWrap_instances, "m", _LibuvStreamWrap_attachToObject).call(this, stream);
    }
    /**
     * Start the reading of the stream.
     * @return An error status code.
     */
    readStart() {
        if (!__classPrivateFieldGet(this, _LibuvStreamWrap_reading, "f")) {
            __classPrivateFieldSet(this, _LibuvStreamWrap_reading, true, "f");
            __classPrivateFieldGet(this, _LibuvStreamWrap_instances, "m", _LibuvStreamWrap_read).call(this);
        }
        return 0;
    }
    /**
     * Stop the reading of the stream.
     * @return An error status code.
     */
    readStop() {
        __classPrivateFieldSet(this, _LibuvStreamWrap_reading, false, "f");
        return 0;
    }
    /**
     * Shutdown the stream.
     * @param req A shutdown request wrapper.
     * @return An error status code.
     */
    shutdown(req) {
        const status = this._onClose();
        try {
            req.oncomplete(status);
        }
        catch (_a) {
            // swallow callback error.
        }
        return 0;
    }
    /**
     * @param userBuf
     * @return An error status code.
     */
    useUserBuffer(_userBuf) {
        // TODO(cmorten)
        notImplemented("LibuvStreamWrap.prototype.useUserBuffer");
    }
    /**
     * Write a buffer to the stream.
     * @param req A write request wrapper.
     * @param data The Uint8Array buffer to write to the stream.
     * @return An error status code.
     */
    writeBuffer(req, data) {
        __classPrivateFieldGet(this, _LibuvStreamWrap_instances, "m", _LibuvStreamWrap_write).call(this, req, data);
        return 0;
    }
    /**
     * Write multiple chunks at once.
     * @param req A write request wrapper.
     * @param chunks
     * @param allBuffers
     * @return An error status code.
     */
    writev(req, chunks, allBuffers) {
        const count = allBuffers ? chunks.length : chunks.length >> 1;
        const buffers = new Array(count);
        if (!allBuffers) {
            for (let i = 0; i < count; i++) {
                const chunk = chunks[i * 2];
                if (Buffer.isBuffer(chunk)) {
                    buffers[i] = chunk;
                }
                // String chunk
                const encoding = chunks[i * 2 + 1];
                buffers[i] = Buffer.from(chunk, encoding);
            }
        }
        else {
            for (let i = 0; i < count; i++) {
                buffers[i] = chunks[i];
            }
        }
        return this.writeBuffer(req, Buffer.concat(buffers));
    }
    /**
     * Write an ASCII string to the stream.
     * @return An error status code.
     */
    writeAsciiString(req, data) {
        const buffer = new TextEncoder().encode(data);
        return this.writeBuffer(req, buffer);
    }
    /**
     * Write an UTF8 string to the stream.
     * @return An error status code.
     */
    writeUtf8String(req, data) {
        const buffer = new TextEncoder().encode(data);
        return this.writeBuffer(req, buffer);
    }
    /**
     * Write an UCS2 string to the stream.
     * @return An error status code.
     */
    writeUcs2String(_req, _data) {
        notImplemented("LibuvStreamWrap.prototype.writeUcs2String");
    }
    /**
     * Write an LATIN1 string to the stream.
     * @return An error status code.
     */
    writeLatin1String(req, data) {
        const buffer = Buffer.from(data, "latin1");
        return this.writeBuffer(req, buffer);
    }
    _onClose() {
        var _a;
        let status = 0;
        __classPrivateFieldSet(this, _LibuvStreamWrap_reading, false, "f");
        try {
            (_a = this[kStreamBaseField]) === null || _a === void 0 ? void 0 : _a.close();
        }
        catch (_b) {
            status = codeMap.get("ENOTCONN");
        }
        return status;
    }
}
_LibuvStreamWrap_reading = new WeakMap(), _LibuvStreamWrap_instances = new WeakSet(), _LibuvStreamWrap_attachToObject = function _LibuvStreamWrap_attachToObject(stream) {
    this[kStreamBaseField] = stream;
}, _LibuvStreamWrap_read = function _LibuvStreamWrap_read() {
    return __awaiter(this, void 0, void 0, function* () {
        let buf = new Uint8Array(SUGGESTED_SIZE);
        let nread;
        try {
            nread = yield this[kStreamBaseField].read(buf);
        }
        catch (e) {
            if (e instanceof Deno.errors.Interrupted ||
                e instanceof Deno.errors.BadResource) {
                nread = codeMap.get("EOF");
            }
            else if (e instanceof Deno.errors.ConnectionReset ||
                e instanceof Deno.errors.ConnectionAborted) {
                nread = codeMap.get("ECONNRESET");
            }
            else {
                nread = codeMap.get("UNKNOWN");
            }
            buf = new Uint8Array(0);
        }
        nread !== null && nread !== void 0 ? nread : (nread = codeMap.get("EOF"));
        streamBaseState[kReadBytesOrError] = nread;
        if (nread > 0) {
            this.bytesRead += nread;
        }
        buf = buf.slice(0, nread);
        streamBaseState[kArrayBufferOffset] = 0;
        try {
            this.onread(buf, nread);
        }
        catch (_a) {
            // swallow callback errors.
        }
        if (nread >= 0 && __classPrivateFieldGet(this, _LibuvStreamWrap_reading, "f")) {
            __classPrivateFieldGet(this, _LibuvStreamWrap_instances, "m", _LibuvStreamWrap_read).call(this);
        }
    });
}, _LibuvStreamWrap_write = function _LibuvStreamWrap_write(req, data) {
    return __awaiter(this, void 0, void 0, function* () {
        const { byteLength } = data;
        try {
            yield writeAll(this[kStreamBaseField], data);
        }
        catch (e) {
            let status;
            // TODO(cmorten): map err to status codes
            if (e instanceof Deno.errors.BadResource ||
                e instanceof Deno.errors.BrokenPipe) {
                status = codeMap.get("EBADF");
            }
            else {
                status = codeMap.get("UNKNOWN");
            }
            try {
                req.oncomplete(status);
            }
            catch (_a) {
                // swallow callback errors.
            }
            return;
        }
        streamBaseState[kBytesWritten] = byteLength;
        this.bytesWritten += byteLength;
        try {
            req.oncomplete(0);
        }
        catch (_b) {
            // swallow callback errors.
        }
        return;
    });
};

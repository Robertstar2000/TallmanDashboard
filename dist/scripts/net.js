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
import { Buffer } from "../buffer.ts";
import { uvException } from "./errors.ts";
import { writeBuffer } from "../internal_binding/node_file.ts";
// IPv4 Segment
const v4Seg = "(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])";
const v4Str = `(${v4Seg}[.]){3}${v4Seg}`;
const IPv4Reg = new RegExp(`^${v4Str}$`);
// IPv6 Segment
const v6Seg = "(?:[0-9a-fA-F]{1,4})";
const IPv6Reg = new RegExp("^(" +
    `(?:${v6Seg}:){7}(?:${v6Seg}|:)|` +
    `(?:${v6Seg}:){6}(?:${v4Str}|:${v6Seg}|:)|` +
    `(?:${v6Seg}:){5}(?::${v4Str}|(:${v6Seg}){1,2}|:)|` +
    `(?:${v6Seg}:){4}(?:(:${v6Seg}){0,1}:${v4Str}|(:${v6Seg}){1,3}|:)|` +
    `(?:${v6Seg}:){3}(?:(:${v6Seg}){0,2}:${v4Str}|(:${v6Seg}){1,4}|:)|` +
    `(?:${v6Seg}:){2}(?:(:${v6Seg}){0,3}:${v4Str}|(:${v6Seg}){1,5}|:)|` +
    `(?:${v6Seg}:){1}(?:(:${v6Seg}){0,4}:${v4Str}|(:${v6Seg}){1,6}|:)|` +
    `(?::((?::${v6Seg}){0,5}:${v4Str}|(?::${v6Seg}){1,7}|:))` +
    ")(%[0-9a-zA-Z-.:]{1,})?$");
export function isIPv4(ip) {
    return RegExp.prototype.test.call(IPv4Reg, ip);
}
export function isIPv6(ip) {
    return RegExp.prototype.test.call(IPv6Reg, ip);
}
export function isIP(ip) {
    if (isIPv4(ip)) {
        return 4;
    }
    if (isIPv6(ip)) {
        return 6;
    }
    return 0;
}
export function makeSyncWrite(fd) {
    return function (
    // deno-lint-ignore no-explicit-any
    chunk, enc, cb) {
        if (enc !== "buffer") {
            chunk = Buffer.from(chunk, enc);
        }
        this._handle.bytesWritten += chunk.length;
        const ctx = {};
        writeBuffer(fd, chunk, 0, chunk.length, null, ctx);
        if (ctx.errno !== undefined) {
            const ex = uvException(ctx);
            ex.errno = ctx.errno;
            return cb(ex);
        }
        cb();
    };
}
export const normalizedArgsSymbol = Symbol("normalizedArgs");

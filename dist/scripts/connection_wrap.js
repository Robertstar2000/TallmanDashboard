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
// This module ports:
// - https://github.com/nodejs/node/blob/master/src/connection_wrap.cc
// - https://github.com/nodejs/node/blob/master/src/connection_wrap.h
import { LibuvStreamWrap } from "./stream_wrap.ts";
export class ConnectionWrap extends LibuvStreamWrap {
    /**
     * Creates a new ConnectionWrap class instance.
     * @param provider Provider type.
     * @param object Optional stream object.
     */
    constructor(provider, object) {
        super(provider, object);
        /** Optional connection callback. */
        this.onconnection = null;
    }
    /**
     * @param req A connect request.
     * @param status An error status code.
     */
    afterConnect(req, status) {
        const isSuccessStatus = !status;
        const readable = isSuccessStatus;
        const writable = isSuccessStatus;
        try {
            req.oncomplete(status, this, req, readable, writable);
        }
        catch (_a) {
            // swallow callback errors.
        }
        return;
    }
}

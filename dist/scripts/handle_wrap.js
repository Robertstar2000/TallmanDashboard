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
// - https://github.com/nodejs/node/blob/master/src/handle_wrap.cc
// - https://github.com/nodejs/node/blob/master/src/handle_wrap.h
import { unreachable } from "../../_util/asserts.ts";
import { AsyncWrap } from "./async_wrap.ts";
export class HandleWrap extends AsyncWrap {
    constructor(provider) {
        super(provider);
    }
    close(cb = () => { }) {
        this._onClose();
        queueMicrotask(cb);
    }
    ref() {
        unreachable();
    }
    unref() {
        unreachable();
    }
    // deno-lint-ignore no-explicit-any
    _onClose() { }
}

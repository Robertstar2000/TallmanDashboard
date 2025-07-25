// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// deno-lint-ignore-file ban-types
import { AssertionError, } from "./assertion_error.ts";
import * as asserts from "../testing/asserts.ts";
import { inspect } from "./util.ts";
import { ERR_AMBIGUOUS_ARGUMENT, ERR_INVALID_ARG_TYPE, ERR_INVALID_ARG_VALUE, ERR_INVALID_RETURN_VALUE, ERR_MISSING_ARGS, } from "./internal/errors.ts";
import { isDeepEqual } from "./internal/util/comparisons.ts";
function innerFail(obj) {
    if (obj.message instanceof Error) {
        throw obj.message;
    }
    throw new AssertionError({
        actual: obj.actual,
        expected: obj.expected,
        message: obj.message,
        operator: obj.operator,
    });
}
// TODO(uki00a): This function is a workaround for setting the `generatedMessage` property flexibly.
function createAssertionError(options) {
    const error = new AssertionError(options);
    if (options.generatedMessage) {
        error.generatedMessage = true;
    }
    return error;
}
/** Converts the std assertion error to node.js assertion error */
function toNode(fn, opts) {
    const { operator, message, actual, expected } = opts || {};
    try {
        fn();
    }
    catch (e) {
        if (e instanceof asserts.AssertionError) {
            if (typeof message === "string") {
                throw new AssertionError({
                    operator,
                    message,
                    actual,
                    expected,
                });
            }
            else if (message instanceof Error) {
                throw message;
            }
            else {
                throw new AssertionError({
                    operator,
                    message: e.message,
                    actual,
                    expected,
                });
            }
        }
        throw e;
    }
}
function assert(actual, message) {
    if (arguments.length === 0) {
        throw new AssertionError({
            message: "No value argument passed to `assert.ok()`",
        });
    }
    toNode(() => asserts.assert(actual), { message, actual, expected: true });
}
const ok = assert;
function throws(fn, error, message) {
    // Check arg types
    if (typeof fn !== "function") {
        throw new ERR_INVALID_ARG_TYPE("fn", "function", fn);
    }
    if (typeof error === "object" && error !== null &&
        Object.getPrototypeOf(error) === Object.prototype &&
        Object.keys(error).length === 0) {
        // error is an empty object
        throw new ERR_INVALID_ARG_VALUE("error", error, "may not be an empty object");
    }
    if (typeof message === "string") {
        if (!(error instanceof RegExp) && typeof error !== "function" &&
            !(error instanceof Error) && typeof error !== "object") {
            throw new ERR_INVALID_ARG_TYPE("error", [
                "Function",
                "Error",
                "RegExp",
                "Object",
            ], error);
        }
    }
    else {
        if (typeof error !== "undefined" && typeof error !== "string" &&
            !(error instanceof RegExp) && typeof error !== "function" &&
            !(error instanceof Error) && typeof error !== "object") {
            throw new ERR_INVALID_ARG_TYPE("error", [
                "Function",
                "Error",
                "RegExp",
                "Object",
            ], error);
        }
    }
    // Checks test function
    try {
        fn();
    }
    catch (e) {
        if (validateThrownError(e, error, message, {
            operator: throws,
        })) {
            return;
        }
    }
    if (message) {
        let msg = `Missing expected exception: ${message}`;
        if (typeof error === "function" && (error === null || error === void 0 ? void 0 : error.name)) {
            msg = `Missing expected exception (${error.name}): ${message}`;
        }
        throw new AssertionError({
            message: msg,
            operator: "throws",
            actual: undefined,
            expected: error,
        });
    }
    else if (typeof error === "string") {
        // Use case of throws(fn, message)
        throw new AssertionError({
            message: `Missing expected exception: ${error}`,
            operator: "throws",
            actual: undefined,
            expected: undefined,
        });
    }
    else if (typeof error === "function" && (error === null || error === void 0 ? void 0 : error.prototype) !== undefined) {
        throw new AssertionError({
            message: `Missing expected exception (${error.name}).`,
            operator: "throws",
            actual: undefined,
            expected: error,
        });
    }
    else {
        throw new AssertionError({
            message: "Missing expected exception.",
            operator: "throws",
            actual: undefined,
            expected: error,
        });
    }
}
function doesNotThrow(fn, expected, message) {
    // Check arg type
    if (typeof fn !== "function") {
        throw new ERR_INVALID_ARG_TYPE("fn", "function", fn);
    }
    else if (!(expected instanceof RegExp) && typeof expected !== "function" &&
        typeof expected !== "string" && typeof expected !== "undefined") {
        throw new ERR_INVALID_ARG_TYPE("expected", ["Function", "RegExp"], fn);
    }
    // Checks test function
    try {
        fn();
    }
    catch (e) {
        gotUnwantedException(e, expected, message, doesNotThrow);
    }
}
function equal(actual, expected, message) {
    if (arguments.length < 2) {
        throw new ERR_MISSING_ARGS("actual", "expected");
    }
    if (actual == expected) {
        return;
    }
    if (Number.isNaN(actual) && Number.isNaN(expected)) {
        return;
    }
    if (typeof message === "string") {
        throw new AssertionError({
            message,
        });
    }
    else if (message instanceof Error) {
        throw message;
    }
    toNode(() => asserts.assertStrictEquals(actual, expected), {
        message: message || `${actual} == ${expected}`,
        operator: "==",
        actual,
        expected,
    });
}
function notEqual(actual, expected, message) {
    if (arguments.length < 2) {
        throw new ERR_MISSING_ARGS("actual", "expected");
    }
    if (Number.isNaN(actual) && Number.isNaN(expected)) {
        throw new AssertionError({
            message: `${actual} != ${expected}`,
            operator: "!=",
            actual,
            expected,
        });
    }
    if (actual != expected) {
        return;
    }
    if (typeof message === "string") {
        throw new AssertionError({
            message,
        });
    }
    else if (message instanceof Error) {
        throw message;
    }
    toNode(() => asserts.assertNotStrictEquals(actual, expected), {
        message: message || `${actual} != ${expected}`,
        operator: "!=",
        actual,
        expected,
    });
}
function strictEqual(actual, expected, message) {
    if (arguments.length < 2) {
        throw new ERR_MISSING_ARGS("actual", "expected");
    }
    toNode(() => asserts.assertStrictEquals(actual, expected), { message, operator: "strictEqual", actual, expected });
}
function notStrictEqual(actual, expected, message) {
    if (arguments.length < 2) {
        throw new ERR_MISSING_ARGS("actual", "expected");
    }
    toNode(() => asserts.assertNotStrictEquals(actual, expected), { message, actual, expected, operator: "notStrictEqual" });
}
function deepEqual(actual, expected, message) {
    if (arguments.length < 2) {
        throw new ERR_MISSING_ARGS("actual", "expected");
    }
    if (!isDeepEqual(actual, expected)) {
        innerFail({ actual, expected, message, operator: "deepEqual" });
    }
}
function notDeepEqual(actual, expected, message) {
    if (arguments.length < 2) {
        throw new ERR_MISSING_ARGS("actual", "expected");
    }
    if (isDeepEqual(actual, expected)) {
        innerFail({ actual, expected, message, operator: "notDeepEqual" });
    }
}
function deepStrictEqual(actual, expected, message) {
    if (arguments.length < 2) {
        throw new ERR_MISSING_ARGS("actual", "expected");
    }
    toNode(() => asserts.assertEquals(actual, expected), { message, actual, expected, operator: "deepStrictEqual" });
}
function notDeepStrictEqual(actual, expected, message) {
    if (arguments.length < 2) {
        throw new ERR_MISSING_ARGS("actual", "expected");
    }
    toNode(() => asserts.assertNotEquals(actual, expected), { message, actual, expected, operator: "deepNotStrictEqual" });
}
function fail(message) {
    if (typeof message === "string" || message == null) {
        throw createAssertionError({
            message: message !== null && message !== void 0 ? message : "Failed",
            operator: "fail",
            generatedMessage: message == null,
        });
    }
    else {
        throw message;
    }
}
function match(actual, regexp, message) {
    if (arguments.length < 2) {
        throw new ERR_MISSING_ARGS("actual", "regexp");
    }
    if (!(regexp instanceof RegExp)) {
        throw new ERR_INVALID_ARG_TYPE("regexp", "RegExp", regexp);
    }
    toNode(() => asserts.assertMatch(actual, regexp), { message, actual, expected: regexp, operator: "match" });
}
function doesNotMatch(string, regexp, message) {
    if (arguments.length < 2) {
        throw new ERR_MISSING_ARGS("string", "regexp");
    }
    if (!(regexp instanceof RegExp)) {
        throw new ERR_INVALID_ARG_TYPE("regexp", "RegExp", regexp);
    }
    if (typeof string !== "string") {
        if (message instanceof Error) {
            throw message;
        }
        throw new AssertionError({
            message: message ||
                `The "string" argument must be of type string. Received type ${typeof string} (${inspect(string)})`,
            actual: string,
            expected: regexp,
            operator: "doesNotMatch",
        });
    }
    toNode(() => asserts.assertNotMatch(string, regexp), { message, actual: string, expected: regexp, operator: "doesNotMatch" });
}
function strict(actual, message) {
    if (arguments.length === 0) {
        throw new AssertionError({
            message: "No value argument passed to `assert.ok()`",
        });
    }
    assert(actual, message);
}
// Intentionally avoid using async/await because test-assert-async.js requires it
function rejects(
// deno-lint-ignore no-explicit-any
asyncFn, error, message) {
    let promise;
    if (typeof asyncFn === "function") {
        try {
            promise = asyncFn();
        }
        catch (err) {
            // If `asyncFn` throws an error synchronously, this function returns a rejected promise.
            return Promise.reject(err);
        }
        if (!isValidThenable(promise)) {
            return Promise.reject(new ERR_INVALID_RETURN_VALUE("instance of Promise", "promiseFn", promise));
        }
    }
    else if (!isValidThenable(asyncFn)) {
        return Promise.reject(new ERR_INVALID_ARG_TYPE("promiseFn", ["function", "Promise"], asyncFn));
    }
    else {
        promise = asyncFn;
    }
    function onFulfilled() {
        let message = "Missing expected rejection";
        if (typeof error === "string") {
            message += `: ${error}`;
        }
        else if (typeof error === "function" && error.prototype !== undefined) {
            message += ` (${error.name}).`;
        }
        else {
            message += ".";
        }
        return Promise.reject(createAssertionError({
            message,
            operator: "rejects",
            generatedMessage: true,
        }));
    }
    // deno-lint-ignore camelcase
    function rejects_onRejected(e) {
        if (validateThrownError(e, error, message, {
            operator: rejects,
            validationFunctionName: "validate",
        })) {
            return;
        }
    }
    return promise.then(onFulfilled, rejects_onRejected);
}
// Intentionally avoid using async/await because test-assert-async.js requires it
function doesNotReject(
// deno-lint-ignore no-explicit-any
asyncFn, error, message) {
    // deno-lint-ignore no-explicit-any
    let promise;
    if (typeof asyncFn === "function") {
        try {
            const value = asyncFn();
            if (!isValidThenable(value)) {
                return Promise.reject(new ERR_INVALID_RETURN_VALUE("instance of Promise", "promiseFn", value));
            }
            promise = value;
        }
        catch (e) {
            // If `asyncFn` throws an error synchronously, this function returns a rejected promise.
            return Promise.reject(e);
        }
    }
    else if (!isValidThenable(asyncFn)) {
        return Promise.reject(new ERR_INVALID_ARG_TYPE("promiseFn", ["function", "Promise"], asyncFn));
    }
    else {
        promise = asyncFn;
    }
    return promise.then(() => { }, (e) => gotUnwantedException(e, error, message, doesNotReject));
}
function gotUnwantedException(
// deno-lint-ignore no-explicit-any
e, expected, message, operator) {
    var _a;
    if (typeof expected === "string") {
        // The use case of doesNotThrow(fn, message);
        throw new AssertionError({
            message: `Got unwanted exception: ${expected}\nActual message: "${e.message}"`,
            operator: operator.name,
        });
    }
    else if (typeof expected === "function" && expected.prototype !== undefined) {
        // The use case of doesNotThrow(fn, Error, message);
        if (e instanceof expected) {
            let msg = `Got unwanted exception: ${(_a = e.constructor) === null || _a === void 0 ? void 0 : _a.name}`;
            if (message) {
                msg += ` ${String(message)}`;
            }
            throw new AssertionError({
                message: msg,
                operator: operator.name,
            });
        }
        else if (expected.prototype instanceof Error) {
            throw e;
        }
        else {
            const result = expected(e);
            if (result === true) {
                let msg = `Got unwanted rejection.\nActual message: "${e.message}"`;
                if (message) {
                    msg += ` ${String(message)}`;
                }
                throw new AssertionError({
                    message: msg,
                    operator: operator.name,
                });
            }
        }
        throw e;
    }
    else {
        if (message) {
            throw new AssertionError({
                message: `Got unwanted exception: ${message}\nActual message: "${e ? e.message : String(e)}"`,
                operator: operator.name,
            });
        }
        throw new AssertionError({
            message: `Got unwanted exception.\nActual message: "${e ? e.message : String(e)}"`,
            operator: operator.name,
        });
    }
}
/**
 * Throws `value` if the value is not `null` or `undefined`.
 *
 * @param err
 */
// deno-lint-ignore no-explicit-any
function ifError(err) {
    var _a;
    if (err !== null && err !== undefined) {
        let message = "ifError got unwanted exception: ";
        if (typeof err === "object" && typeof err.message === "string") {
            if (err.message.length === 0 && err.constructor) {
                message += err.constructor.name;
            }
            else {
                message += err.message;
            }
        }
        else {
            message += inspect(err);
        }
        const newErr = new AssertionError({
            actual: err,
            expected: null,
            operator: "ifError",
            message,
            stackStartFn: ifError,
        });
        // Make sure we actually have a stack trace!
        const origStack = err.stack;
        if (typeof origStack === "string") {
            // This will remove any duplicated frames from the error frames taken
            // from within `ifError` and add the original error frames to the newly
            // created ones.
            const tmp2 = origStack.split("\n");
            tmp2.shift();
            // Filter all frames existing in err.stack.
            let tmp1 = (_a = newErr.stack) === null || _a === void 0 ? void 0 : _a.split("\n");
            for (const errFrame of tmp2) {
                // Find the first occurrence of the frame.
                const pos = tmp1 === null || tmp1 === void 0 ? void 0 : tmp1.indexOf(errFrame);
                if (pos !== -1) {
                    // Only keep new frames.
                    tmp1 = tmp1 === null || tmp1 === void 0 ? void 0 : tmp1.slice(0, pos);
                    break;
                }
            }
            newErr.stack = `${tmp1 === null || tmp1 === void 0 ? void 0 : tmp1.join("\n")}\n${tmp2.join("\n")}`;
        }
        throw newErr;
    }
}
function validateThrownError(
// deno-lint-ignore no-explicit-any
e, error, message, options) {
    var _a;
    if (typeof error === "string") {
        if (message != null) {
            throw new ERR_INVALID_ARG_TYPE("error", ["Object", "Error", "Function", "RegExp"], error);
        }
        else if (typeof e === "object" && e !== null) {
            if (e.message === error) {
                throw new ERR_AMBIGUOUS_ARGUMENT("error/message", `The error message "${e.message}" is identical to the message.`);
            }
        }
        else if (e === error) {
            throw new ERR_AMBIGUOUS_ARGUMENT("error/message", `The error "${e}" is identical to the message.`);
        }
        message = error;
        error = undefined;
    }
    if (error instanceof Function && error.prototype !== undefined &&
        error.prototype instanceof Error) {
        // error is a constructor
        if (e instanceof error) {
            return true;
        }
        throw createAssertionError({
            message: `The error is expected to be an instance of "${error.name}". Received "${(_a = e === null || e === void 0 ? void 0 : e.constructor) === null || _a === void 0 ? void 0 : _a.name}"\n\nError message:\n\n${e === null || e === void 0 ? void 0 : e.message}`,
            actual: e,
            expected: error,
            operator: options.operator.name,
            generatedMessage: true,
        });
    }
    if (error instanceof Function) {
        const received = error(e);
        if (received === true) {
            return true;
        }
        throw createAssertionError({
            message: `The ${options.validationFunctionName
                ? `"${options.validationFunctionName}" validation`
                : "validation"} function is expected to return "true". Received ${inspect(received)}\n\nCaught error:\n\n${e}`,
            actual: e,
            expected: error,
            operator: options.operator.name,
            generatedMessage: true,
        });
    }
    if (error instanceof RegExp) {
        if (error.test(String(e))) {
            return true;
        }
        throw createAssertionError({
            message: `The input did not match the regular expression ${error.toString()}. Input:\n\n'${String(e)}'\n`,
            actual: e,
            expected: error,
            operator: options.operator.name,
            generatedMessage: true,
        });
    }
    if (typeof error === "object" && error !== null) {
        const keys = Object.keys(error);
        if (error instanceof Error) {
            keys.push("name", "message");
        }
        for (const k of keys) {
            if (e == null) {
                throw createAssertionError({
                    message: message || "object is expected to thrown, but got null",
                    actual: e,
                    expected: error,
                    operator: options.operator.name,
                    generatedMessage: message == null,
                });
            }
            if (typeof e === "string") {
                throw createAssertionError({
                    message: message ||
                        `object is expected to thrown, but got string: ${e}`,
                    actual: e,
                    expected: error,
                    operator: options.operator.name,
                    generatedMessage: message == null,
                });
            }
            if (typeof e === "number") {
                throw createAssertionError({
                    message: message ||
                        `object is expected to thrown, but got number: ${e}`,
                    actual: e,
                    expected: error,
                    operator: options.operator.name,
                    generatedMessage: message == null,
                });
            }
            if (!(k in e)) {
                throw createAssertionError({
                    message: message || `A key in the expected object is missing: ${k}`,
                    actual: e,
                    expected: error,
                    operator: options.operator.name,
                    generatedMessage: message == null,
                });
            }
            const actual = e[k];
            // deno-lint-ignore no-explicit-any
            const expected = error[k];
            if (typeof actual === "string" && expected instanceof RegExp) {
                match(actual, expected);
            }
            else {
                deepStrictEqual(actual, expected);
            }
        }
        return true;
    }
    if (typeof error === "undefined") {
        return true;
    }
    throw createAssertionError({
        message: `Invalid expectation: ${error}`,
        operator: options.operator.name,
        generatedMessage: true,
    });
}
// deno-lint-ignore no-explicit-any
function isValidThenable(maybeThennable) {
    if (!maybeThennable) {
        return false;
    }
    if (maybeThennable instanceof Promise) {
        return true;
    }
    const isThenable = typeof maybeThennable.then === "function" &&
        typeof maybeThennable.catch === "function";
    return isThenable && typeof maybeThennable !== "function";
}
Object.assign(strict, {
    AssertionError,
    deepEqual: deepStrictEqual,
    deepStrictEqual,
    doesNotMatch,
    doesNotReject,
    doesNotThrow,
    equal: strictEqual,
    fail,
    ifError,
    match,
    notDeepEqual: notDeepStrictEqual,
    notDeepStrictEqual,
    notEqual: notStrictEqual,
    notStrictEqual,
    ok,
    rejects,
    strict,
    strictEqual,
    throws,
});
export default Object.assign(assert, {
    AssertionError,
    deepEqual,
    deepStrictEqual,
    doesNotMatch,
    doesNotReject,
    doesNotThrow,
    equal,
    fail,
    ifError,
    match,
    notDeepEqual,
    notDeepStrictEqual,
    notEqual,
    notStrictEqual,
    ok,
    rejects,
    strict,
    strictEqual,
    throws,
});
export { AssertionError, deepEqual, deepStrictEqual, doesNotMatch, doesNotReject, doesNotThrow, equal, fail, ifError, match, notDeepEqual, notDeepStrictEqual, notEqual, notStrictEqual, ok, rejects, strict, strictEqual, throws, };

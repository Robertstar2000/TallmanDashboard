// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
export const osType = (() => {
    var _a, _b, _c;
    // deno-lint-ignore no-explicit-any
    const { Deno } = globalThis;
    if (typeof ((_a = Deno === null || Deno === void 0 ? void 0 : Deno.build) === null || _a === void 0 ? void 0 : _a.os) === "string") {
        return Deno.build.os;
    }
    // deno-lint-ignore no-explicit-any
    const { navigator } = globalThis;
    if ((_c = (_b = navigator === null || navigator === void 0 ? void 0 : navigator.appVersion) === null || _b === void 0 ? void 0 : _b.includes) === null || _c === void 0 ? void 0 : _c.call(_b, "Win")) {
        return "windows";
    }
    return "linux";
})();
export const isWindows = osType === "windows";
export const isLinux = osType === "linux";

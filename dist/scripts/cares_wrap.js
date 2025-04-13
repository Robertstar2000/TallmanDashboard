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
var _ChannelWrap_instances, _ChannelWrap_servers, _ChannelWrap_timeout, _ChannelWrap_tries, _ChannelWrap_query, _ChannelWrap_resolve;
import { isIPv4 } from "../internal/net.ts";
import { codeMap } from "./uv.ts";
import { AsyncWrap, providerType } from "./async_wrap.ts";
import { ares_strerror } from "./ares.ts";
import { notImplemented } from "../_utils.ts";
import { isWindows } from "../../_util/os.ts";
export class GetAddrInfoReqWrap extends AsyncWrap {
    constructor() {
        super(providerType.GETADDRINFOREQWRAP);
    }
}
export function getaddrinfo(req, hostname, family, _hints, verbatim) {
    let addresses = [];
    // TODO(cmorten): use hints
    // REF: https://nodejs.org/api/dns.html#dns_supported_getaddrinfo_flags
    const recordTypes = [];
    if (family === 0 || family === 4) {
        recordTypes.push("A");
    }
    if (family === 0 || family === 6) {
        recordTypes.push("AAAA");
    }
    (() => __awaiter(this, void 0, void 0, function* () {
        yield Promise.allSettled(recordTypes.map((recordType) => Deno.resolveDns(hostname, recordType).then((records) => {
            records.forEach((record) => addresses.push(record));
        })));
        const error = addresses.length ? 0 : codeMap.get("EAI_NODATA");
        // TODO(cmorten): needs work
        // REF: https://github.com/nodejs/node/blob/master/src/cares_wrap.cc#L1444
        if (!verbatim) {
            addresses.sort((a, b) => {
                if (isIPv4(a)) {
                    return -1;
                }
                else if (isIPv4(b)) {
                    return 1;
                }
                return 0;
            });
        }
        // TODO: Forces IPv4 as a workaround for Deno not
        // aligning with Node on implicit binding on Windows
        // REF: https://github.com/denoland/deno/issues/10762
        if (isWindows && hostname === "localhost") {
            addresses = addresses.filter((address) => isIPv4(address));
        }
        req.oncomplete(error, addresses);
    }))();
    return 0;
}
export class QueryReqWrap extends AsyncWrap {
    constructor() {
        super(providerType.QUERYWRAP);
    }
}
function fqdnToHostname(fqdn) {
    return fqdn.replace(/\.$/, "");
}
function compressIPv6(address) {
    const formatted = address.replace(/\b(?:0+:){2,}/, ":");
    const finalAddress = formatted
        .split(":")
        .map((octet) => {
        if (octet.match(/^\d+\.\d+\.\d+\.\d+$/)) {
            // decimal
            return Number(octet.replaceAll(".", "")).toString(16);
        }
        return octet.replace(/\b0+/g, "");
    })
        .join(":");
    return finalAddress;
}
export class ChannelWrap extends AsyncWrap {
    constructor(timeout, tries) {
        super(providerType.DNSCHANNEL);
        _ChannelWrap_instances.add(this);
        _ChannelWrap_servers.set(this, []);
        _ChannelWrap_timeout.set(this, void 0);
        _ChannelWrap_tries.set(this, void 0);
        __classPrivateFieldSet(this, _ChannelWrap_timeout, timeout, "f");
        __classPrivateFieldSet(this, _ChannelWrap_tries, tries, "f");
    }
    queryAny(req, name) {
        // TODO: implemented temporary measure to allow limited usage of
        // `resolveAny` like APIs.
        //
        // Ideally we move to using the "ANY" / "*" DNS query in future
        // REF: https://github.com/denoland/deno/issues/14492
        (() => __awaiter(this, void 0, void 0, function* () {
            const records = [];
            yield Promise.allSettled([
                __classPrivateFieldGet(this, _ChannelWrap_instances, "m", _ChannelWrap_query).call(this, name, "A").then(({ ret }) => {
                    ret.forEach((record) => records.push({ type: "A", address: record }));
                }),
                __classPrivateFieldGet(this, _ChannelWrap_instances, "m", _ChannelWrap_query).call(this, name, "AAAA").then(({ ret }) => {
                    ret.forEach((record) => records.push({ type: "AAAA", address: compressIPv6(record) }));
                }),
                __classPrivateFieldGet(this, _ChannelWrap_instances, "m", _ChannelWrap_query).call(this, name, "CAA").then(({ ret }) => {
                    ret.forEach(({ critical, tag, value }) => records.push({
                        type: "CAA",
                        [tag]: value,
                        critical: +critical && 128,
                    }));
                }),
                __classPrivateFieldGet(this, _ChannelWrap_instances, "m", _ChannelWrap_query).call(this, name, "CNAME").then(({ ret }) => {
                    ret.forEach((record) => records.push({ type: "CNAME", value: record }));
                }),
                __classPrivateFieldGet(this, _ChannelWrap_instances, "m", _ChannelWrap_query).call(this, name, "MX").then(({ ret }) => {
                    ret.forEach(({ preference, exchange }) => records.push({
                        type: "MX",
                        priority: preference,
                        exchange: fqdnToHostname(exchange),
                    }));
                }),
                __classPrivateFieldGet(this, _ChannelWrap_instances, "m", _ChannelWrap_query).call(this, name, "NAPTR").then(({ ret }) => {
                    ret.forEach(({ order, preference, flags, services, regexp, replacement }) => records.push({
                        type: "NAPTR",
                        order,
                        preference,
                        flags,
                        service: services,
                        regexp,
                        replacement,
                    }));
                }),
                __classPrivateFieldGet(this, _ChannelWrap_instances, "m", _ChannelWrap_query).call(this, name, "NS").then(({ ret }) => {
                    ret.forEach((record) => records.push({ type: "NS", value: fqdnToHostname(record) }));
                }),
                __classPrivateFieldGet(this, _ChannelWrap_instances, "m", _ChannelWrap_query).call(this, name, "PTR").then(({ ret }) => {
                    ret.forEach((record) => records.push({ type: "PTR", value: fqdnToHostname(record) }));
                }),
                __classPrivateFieldGet(this, _ChannelWrap_instances, "m", _ChannelWrap_query).call(this, name, "SOA").then(({ ret }) => {
                    ret.forEach(({ mname, rname, serial, refresh, retry, expire, minimum }) => records.push({
                        type: "SOA",
                        nsname: fqdnToHostname(mname),
                        hostmaster: fqdnToHostname(rname),
                        serial,
                        refresh,
                        retry,
                        expire,
                        minttl: minimum,
                    }));
                }),
                __classPrivateFieldGet(this, _ChannelWrap_instances, "m", _ChannelWrap_query).call(this, name, "SRV").then(({ ret }) => {
                    ret.forEach(({ priority, weight, port, target }) => records.push({
                        type: "SRV",
                        priority,
                        weight,
                        port,
                        name: target,
                    }));
                }),
                __classPrivateFieldGet(this, _ChannelWrap_instances, "m", _ChannelWrap_query).call(this, name, "TXT").then(({ ret }) => {
                    ret.forEach((record) => records.push({ type: "TXT", entries: record }));
                }),
            ]);
            const err = records.length ? 0 : codeMap.get("EAI_NODATA");
            req.oncomplete(err, records);
        }))();
        return 0;
    }
    queryA(req, name) {
        __classPrivateFieldGet(this, _ChannelWrap_instances, "m", _ChannelWrap_query).call(this, name, "A").then(({ code, ret }) => {
            req.oncomplete(code, ret);
        });
        return 0;
    }
    queryAaaa(req, name) {
        __classPrivateFieldGet(this, _ChannelWrap_instances, "m", _ChannelWrap_query).call(this, name, "AAAA").then(({ code, ret }) => {
            const records = ret.map((record) => compressIPv6(record));
            req.oncomplete(code, records);
        });
        return 0;
    }
    queryCaa(req, name) {
        __classPrivateFieldGet(this, _ChannelWrap_instances, "m", _ChannelWrap_query).call(this, name, "CAA").then(({ code, ret }) => {
            const records = ret.map(({ critical, tag, value }) => ({
                [tag]: value,
                critical: +critical && 128,
            }));
            req.oncomplete(code, records);
        });
        return 0;
    }
    queryCname(req, name) {
        __classPrivateFieldGet(this, _ChannelWrap_instances, "m", _ChannelWrap_query).call(this, name, "CNAME").then(({ code, ret }) => {
            req.oncomplete(code, ret);
        });
        return 0;
    }
    queryMx(req, name) {
        __classPrivateFieldGet(this, _ChannelWrap_instances, "m", _ChannelWrap_query).call(this, name, "MX").then(({ code, ret }) => {
            const records = ret.map(({ preference, exchange }) => ({
                priority: preference,
                exchange: fqdnToHostname(exchange),
            }));
            req.oncomplete(code, records);
        });
        return 0;
    }
    queryNaptr(req, name) {
        __classPrivateFieldGet(this, _ChannelWrap_instances, "m", _ChannelWrap_query).call(this, name, "NAPTR").then(({ code, ret }) => {
            const records = ret.map(({ order, preference, flags, services, regexp, replacement }) => ({
                flags,
                service: services,
                regexp,
                replacement,
                order,
                preference,
            }));
            req.oncomplete(code, records);
        });
        return 0;
    }
    queryNs(req, name) {
        __classPrivateFieldGet(this, _ChannelWrap_instances, "m", _ChannelWrap_query).call(this, name, "NS").then(({ code, ret }) => {
            const records = ret.map((record) => fqdnToHostname(record));
            req.oncomplete(code, records);
        });
        return 0;
    }
    queryPtr(req, name) {
        __classPrivateFieldGet(this, _ChannelWrap_instances, "m", _ChannelWrap_query).call(this, name, "PTR").then(({ code, ret }) => {
            const records = ret.map((record) => fqdnToHostname(record));
            req.oncomplete(code, records);
        });
        return 0;
    }
    querySoa(req, name) {
        __classPrivateFieldGet(this, _ChannelWrap_instances, "m", _ChannelWrap_query).call(this, name, "SOA").then(({ code, ret }) => {
            let record = {};
            if (ret.length) {
                const { mname, rname, serial, refresh, retry, expire, minimum } = ret[0];
                record = {
                    nsname: fqdnToHostname(mname),
                    hostmaster: fqdnToHostname(rname),
                    serial,
                    refresh,
                    retry,
                    expire,
                    minttl: minimum,
                };
            }
            req.oncomplete(code, record);
        });
        return 0;
    }
    querySrv(req, name) {
        __classPrivateFieldGet(this, _ChannelWrap_instances, "m", _ChannelWrap_query).call(this, name, "SRV").then(({ code, ret }) => {
            const records = ret.map(({ priority, weight, port, target }) => ({
                priority,
                weight,
                port,
                name: target,
            }));
            req.oncomplete(code, records);
        });
        return 0;
    }
    queryTxt(req, name) {
        __classPrivateFieldGet(this, _ChannelWrap_instances, "m", _ChannelWrap_query).call(this, name, "TXT").then(({ code, ret }) => {
            req.oncomplete(code, ret);
        });
        return 0;
    }
    getHostByAddr(_req, _name) {
        // TODO: https://github.com/denoland/deno/issues/14432
        notImplemented("cares.ChannelWrap.prototype.getHostByAddr");
    }
    getServers() {
        return __classPrivateFieldGet(this, _ChannelWrap_servers, "f");
    }
    setServers(servers) {
        if (typeof servers === "string") {
            const tuples = [];
            for (let i = 0; i < servers.length; i += 2) {
                tuples.push([servers[i], parseInt(servers[i + 1])]);
            }
            __classPrivateFieldSet(this, _ChannelWrap_servers, tuples, "f");
        }
        else {
            __classPrivateFieldSet(this, _ChannelWrap_servers, servers.map(([_ipVersion, ip, port]) => [ip, port]), "f");
        }
        return 0;
    }
    setLocalAddress(_addr0, _addr1) {
        notImplemented("cares.ChannelWrap.prototype.setLocalAddress");
    }
    cancel() {
        notImplemented("cares.ChannelWrap.prototype.cancel");
    }
}
_ChannelWrap_servers = new WeakMap(), _ChannelWrap_timeout = new WeakMap(), _ChannelWrap_tries = new WeakMap(), _ChannelWrap_instances = new WeakSet(), _ChannelWrap_query = function _ChannelWrap_query(query, recordType) {
    return __awaiter(this, void 0, void 0, function* () {
        // TODO: TTL logic.
        let code;
        let ret;
        if (__classPrivateFieldGet(this, _ChannelWrap_servers, "f").length) {
            for (const [ipAddr, port] of __classPrivateFieldGet(this, _ChannelWrap_servers, "f")) {
                const resolveOptions = {
                    nameServer: {
                        ipAddr,
                        port,
                    },
                };
                ({ code, ret } = yield __classPrivateFieldGet(this, _ChannelWrap_instances, "m", _ChannelWrap_resolve).call(this, query, recordType, resolveOptions));
                if (code === 0 || code === codeMap.get("EAI_NODATA")) {
                    break;
                }
            }
        }
        else {
            ({ code, ret } = yield __classPrivateFieldGet(this, _ChannelWrap_instances, "m", _ChannelWrap_resolve).call(this, query, recordType));
        }
        return { code: code, ret: ret };
    });
}, _ChannelWrap_resolve = function _ChannelWrap_resolve(query, recordType, resolveOptions) {
    return __awaiter(this, void 0, void 0, function* () {
        let ret = [];
        let code = 0;
        try {
            ret = yield Deno.resolveDns(query, recordType, resolveOptions);
        }
        catch (e) {
            if (e instanceof Deno.errors.NotFound) {
                code = codeMap.get("EAI_NODATA");
            }
            else {
                // TODO(cmorten): map errors to appropriate error codes.
                code = codeMap.get("UNKNOWN");
            }
        }
        return { code, ret };
    });
};
const DNS_ESETSRVPENDING = -1000;
const EMSG_ESETSRVPENDING = "There are pending queries.";
export function strerror(code) {
    return code === DNS_ESETSRVPENDING
        ? EMSG_ESETSRVPENDING
        : ares_strerror(code);
}

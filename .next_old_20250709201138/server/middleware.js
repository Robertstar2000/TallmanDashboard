// runtime can't be in strict mode because a global variable is assign and maybe created.
(self["webpackChunk_N_E"] = self["webpackChunk_N_E"] || []).push([[826],{

/***/ 905:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* binding */ next_middleware_loaderabsolutePagePath_private_next_root_dir_2Fmiddleware_ts_page_2Fmiddleware_rootDir_C_3A_5CUsers_5CBobM_5CCascadeProjects_5CTallmanDashboard_new_matchers_preferredRegion_middlewareConfig_e30_3D_)
});

// NAMESPACE OBJECT: ./middleware.ts
var middleware_namespaceObject_0 = {};
__webpack_require__.r(middleware_namespaceObject_0);
__webpack_require__.d(middleware_namespaceObject_0, {
  config: () => (config),
  middleware: () => (middleware)
});

;// CONCATENATED MODULE: ./node_modules/next/dist/esm/server/web/globals.js
async function registerInstrumentation() {
    if ("_ENTRIES" in globalThis && _ENTRIES.middleware_instrumentation && _ENTRIES.middleware_instrumentation.register) {
        try {
            await _ENTRIES.middleware_instrumentation.register();
        } catch (err) {
            err.message = `An error occurred while loading instrumentation hook: ${err.message}`;
            throw err;
        }
    }
}
let registerInstrumentationPromise = null;
function ensureInstrumentationRegistered() {
    if (!registerInstrumentationPromise) {
        registerInstrumentationPromise = registerInstrumentation();
    }
    return registerInstrumentationPromise;
}
function getUnsupportedModuleErrorMessage(module) {
    // warning: if you change these messages, you must adjust how react-dev-overlay's middleware detects modules not found
    return `The edge runtime does not support Node.js '${module}' module.
Learn More: https://nextjs.org/docs/messages/node-module-in-edge-runtime`;
}
function __import_unsupported(moduleName) {
    const proxy = new Proxy(function() {}, {
        get (_obj, prop) {
            if (prop === "then") {
                return {};
            }
            throw new Error(getUnsupportedModuleErrorMessage(moduleName));
        },
        construct () {
            throw new Error(getUnsupportedModuleErrorMessage(moduleName));
        },
        apply (_target, _this, args) {
            if (typeof args[0] === "function") {
                return args[0](proxy);
            }
            throw new Error(getUnsupportedModuleErrorMessage(moduleName));
        }
    });
    return new Proxy({}, {
        get: ()=>proxy
    });
}
function enhanceGlobals() {
    // The condition is true when the "process" module is provided
    if (process !== __webpack_require__.g.process) {
        // prefer local process but global.process has correct "env"
        process.env = __webpack_require__.g.process.env;
        __webpack_require__.g.process = process;
    }
    // to allow building code that import but does not use node.js modules,
    // webpack will expect this function to exist in global scope
    Object.defineProperty(globalThis, "__import_unsupported", {
        value: __import_unsupported,
        enumerable: false,
        configurable: false
    });
    // Eagerly fire instrumentation hook to make the startup faster.
    void ensureInstrumentationRegistered();
}
enhanceGlobals(); //# sourceMappingURL=globals.js.map

;// CONCATENATED MODULE: ./node_modules/next/dist/esm/server/web/error.js
class PageSignatureError extends Error {
    constructor({ page }){
        super(`The middleware "${page}" accepts an async API directly with the form:
  
  export function middleware(request, event) {
    return NextResponse.redirect('/new-location')
  }
  
  Read more: https://nextjs.org/docs/messages/middleware-new-signature
  `);
    }
}
class RemovedPageError extends Error {
    constructor(){
        super(`The request.page has been deprecated in favour of \`URLPattern\`.
  Read more: https://nextjs.org/docs/messages/middleware-request-page
  `);
    }
}
class RemovedUAError extends Error {
    constructor(){
        super(`The request.ua has been removed in favour of \`userAgent\` function.
  Read more: https://nextjs.org/docs/messages/middleware-parse-user-agent
  `);
    }
} //# sourceMappingURL=error.js.map

;// CONCATENATED MODULE: ./node_modules/next/dist/esm/server/web/utils.js
/**
 * Converts a Node.js IncomingHttpHeaders object to a Headers object. Any
 * headers with multiple values will be joined with a comma and space. Any
 * headers that have an undefined value will be ignored and others will be
 * coerced to strings.
 *
 * @param nodeHeaders the headers object to convert
 * @returns the converted headers object
 */ function fromNodeOutgoingHttpHeaders(nodeHeaders) {
    const headers = new Headers();
    for (let [key, value] of Object.entries(nodeHeaders)){
        const values = Array.isArray(value) ? value : [
            value
        ];
        for (let v of values){
            if (typeof v === "undefined") continue;
            if (typeof v === "number") {
                v = v.toString();
            }
            headers.append(key, v);
        }
    }
    return headers;
}
/*
  Set-Cookie header field-values are sometimes comma joined in one string. This splits them without choking on commas
  that are within a single set-cookie field-value, such as in the Expires portion.
  This is uncommon, but explicitly allowed - see https://tools.ietf.org/html/rfc2616#section-4.2
  Node.js does this for every header *except* set-cookie - see https://github.com/nodejs/node/blob/d5e363b77ebaf1caf67cd7528224b651c86815c1/lib/_http_incoming.js#L128
  React Native's fetch does this for *every* header, including set-cookie.
  
  Based on: https://github.com/google/j2objc/commit/16820fdbc8f76ca0c33472810ce0cb03d20efe25
  Credits to: https://github.com/tomball for original and https://github.com/chrusart for JavaScript implementation
*/ function splitCookiesString(cookiesString) {
    var cookiesStrings = [];
    var pos = 0;
    var start;
    var ch;
    var lastComma;
    var nextStart;
    var cookiesSeparatorFound;
    function skipWhitespace() {
        while(pos < cookiesString.length && /\s/.test(cookiesString.charAt(pos))){
            pos += 1;
        }
        return pos < cookiesString.length;
    }
    function notSpecialChar() {
        ch = cookiesString.charAt(pos);
        return ch !== "=" && ch !== ";" && ch !== ",";
    }
    while(pos < cookiesString.length){
        start = pos;
        cookiesSeparatorFound = false;
        while(skipWhitespace()){
            ch = cookiesString.charAt(pos);
            if (ch === ",") {
                // ',' is a cookie separator if we have later first '=', not ';' or ','
                lastComma = pos;
                pos += 1;
                skipWhitespace();
                nextStart = pos;
                while(pos < cookiesString.length && notSpecialChar()){
                    pos += 1;
                }
                // currently special character
                if (pos < cookiesString.length && cookiesString.charAt(pos) === "=") {
                    // we found cookies separator
                    cookiesSeparatorFound = true;
                    // pos is inside the next cookie, so back up and return it.
                    pos = nextStart;
                    cookiesStrings.push(cookiesString.substring(start, lastComma));
                    start = pos;
                } else {
                    // in param ',' or param separator ';',
                    // we continue from that comma
                    pos = lastComma + 1;
                }
            } else {
                pos += 1;
            }
        }
        if (!cookiesSeparatorFound || pos >= cookiesString.length) {
            cookiesStrings.push(cookiesString.substring(start, cookiesString.length));
        }
    }
    return cookiesStrings;
}
/**
 * Converts a Headers object to a Node.js OutgoingHttpHeaders object. This is
 * required to support the set-cookie header, which may have multiple values.
 *
 * @param headers the headers object to convert
 * @returns the converted headers object
 */ function toNodeOutgoingHttpHeaders(headers) {
    const nodeHeaders = {};
    const cookies = [];
    if (headers) {
        for (const [key, value] of headers.entries()){
            if (key.toLowerCase() === "set-cookie") {
                // We may have gotten a comma joined string of cookies, or multiple
                // set-cookie headers. We need to merge them into one header array
                // to represent all the cookies.
                cookies.push(...splitCookiesString(value));
                nodeHeaders[key] = cookies.length === 1 ? cookies[0] : cookies;
            } else {
                nodeHeaders[key] = value;
            }
        }
    }
    return nodeHeaders;
}
/**
 * Validate the correctness of a user-provided URL.
 */ function validateURL(url) {
    try {
        return String(new URL(String(url)));
    } catch (error) {
        throw new Error(`URL is malformed "${String(url)}". Please use only absolute URLs - https://nextjs.org/docs/messages/middleware-relative-urls`, {
            cause: error
        });
    }
} //# sourceMappingURL=utils.js.map

;// CONCATENATED MODULE: ./node_modules/next/dist/esm/server/web/spec-extension/fetch-event.js

const responseSymbol = Symbol("response");
const passThroughSymbol = Symbol("passThrough");
const waitUntilSymbol = Symbol("waitUntil");
class FetchEvent {
    // eslint-disable-next-line @typescript-eslint/no-useless-constructor
    constructor(_request){
        this[waitUntilSymbol] = [];
        this[passThroughSymbol] = false;
    }
    respondWith(response) {
        if (!this[responseSymbol]) {
            this[responseSymbol] = Promise.resolve(response);
        }
    }
    passThroughOnException() {
        this[passThroughSymbol] = true;
    }
    waitUntil(promise) {
        this[waitUntilSymbol].push(promise);
    }
}
class NextFetchEvent extends FetchEvent {
    constructor(params){
        super(params.request);
        this.sourcePage = params.page;
    }
    /**
   * @deprecated The `request` is now the first parameter and the API is now async.
   *
   * Read more: https://nextjs.org/docs/messages/middleware-new-signature
   */ get request() {
        throw new PageSignatureError({
            page: this.sourcePage
        });
    }
    /**
   * @deprecated Using `respondWith` is no longer needed.
   *
   * Read more: https://nextjs.org/docs/messages/middleware-new-signature
   */ respondWith() {
        throw new PageSignatureError({
            page: this.sourcePage
        });
    }
} //# sourceMappingURL=fetch-event.js.map

;// CONCATENATED MODULE: ./node_modules/next/dist/esm/shared/lib/i18n/detect-domain-locale.js
function detectDomainLocale(domainItems, hostname, detectedLocale) {
    if (!domainItems) return;
    if (detectedLocale) {
        detectedLocale = detectedLocale.toLowerCase();
    }
    for (const item of domainItems){
        var _item_domain, _item_locales;
        // remove port if present
        const domainHostname = (_item_domain = item.domain) == null ? void 0 : _item_domain.split(":")[0].toLowerCase();
        if (hostname === domainHostname || detectedLocale === item.defaultLocale.toLowerCase() || ((_item_locales = item.locales) == null ? void 0 : _item_locales.some((locale)=>locale.toLowerCase() === detectedLocale))) {
            return item;
        }
    }
} //# sourceMappingURL=detect-domain-locale.js.map

;// CONCATENATED MODULE: ./node_modules/next/dist/esm/shared/lib/router/utils/remove-trailing-slash.js
/**
 * Removes the trailing slash for a given route or page path. Preserves the
 * root page. Examples:
 *   - `/foo/bar/` -> `/foo/bar`
 *   - `/foo/bar` -> `/foo/bar`
 *   - `/` -> `/`
 */ function removeTrailingSlash(route) {
    return route.replace(/\/$/, "") || "/";
} //# sourceMappingURL=remove-trailing-slash.js.map

;// CONCATENATED MODULE: ./node_modules/next/dist/esm/shared/lib/router/utils/parse-path.js
/**
 * Given a path this function will find the pathname, query and hash and return
 * them. This is useful to parse full paths on the client side.
 * @param path A path to parse e.g. /foo/bar?id=1#hash
 */ function parsePath(path) {
    const hashIndex = path.indexOf("#");
    const queryIndex = path.indexOf("?");
    const hasQuery = queryIndex > -1 && (hashIndex < 0 || queryIndex < hashIndex);
    if (hasQuery || hashIndex > -1) {
        return {
            pathname: path.substring(0, hasQuery ? queryIndex : hashIndex),
            query: hasQuery ? path.substring(queryIndex, hashIndex > -1 ? hashIndex : undefined) : "",
            hash: hashIndex > -1 ? path.slice(hashIndex) : ""
        };
    }
    return {
        pathname: path,
        query: "",
        hash: ""
    };
} //# sourceMappingURL=parse-path.js.map

;// CONCATENATED MODULE: ./node_modules/next/dist/esm/shared/lib/router/utils/add-path-prefix.js

/**
 * Adds the provided prefix to the given path. It first ensures that the path
 * is indeed starting with a slash.
 */ function addPathPrefix(path, prefix) {
    if (!path.startsWith("/") || !prefix) {
        return path;
    }
    const { pathname, query, hash } = parsePath(path);
    return "" + prefix + pathname + query + hash;
} //# sourceMappingURL=add-path-prefix.js.map

;// CONCATENATED MODULE: ./node_modules/next/dist/esm/shared/lib/router/utils/add-path-suffix.js

/**
 * Similarly to `addPathPrefix`, this function adds a suffix at the end on the
 * provided path. It also works only for paths ensuring the argument starts
 * with a slash.
 */ function addPathSuffix(path, suffix) {
    if (!path.startsWith("/") || !suffix) {
        return path;
    }
    const { pathname, query, hash } = parsePath(path);
    return "" + pathname + suffix + query + hash;
} //# sourceMappingURL=add-path-suffix.js.map

;// CONCATENATED MODULE: ./node_modules/next/dist/esm/shared/lib/router/utils/path-has-prefix.js

/**
 * Checks if a given path starts with a given prefix. It ensures it matches
 * exactly without containing extra chars. e.g. prefix /docs should replace
 * for /docs, /docs/, /docs/a but not /docsss
 * @param path The path to check.
 * @param prefix The prefix to check against.
 */ function pathHasPrefix(path, prefix) {
    if (typeof path !== "string") {
        return false;
    }
    const { pathname } = parsePath(path);
    return pathname === prefix || pathname.startsWith(prefix + "/");
} //# sourceMappingURL=path-has-prefix.js.map

;// CONCATENATED MODULE: ./node_modules/next/dist/esm/shared/lib/router/utils/add-locale.js


/**
 * For a given path and a locale, if the locale is given, it will prefix the
 * locale. The path shouldn't be an API path. If a default locale is given the
 * prefix will be omitted if the locale is already the default locale.
 */ function addLocale(path, locale, defaultLocale, ignorePrefix) {
    // If no locale was given or the locale is the default locale, we don't need
    // to prefix the path.
    if (!locale || locale === defaultLocale) return path;
    const lower = path.toLowerCase();
    // If the path is an API path or the path already has the locale prefix, we
    // don't need to prefix the path.
    if (!ignorePrefix) {
        if (pathHasPrefix(lower, "/api")) return path;
        if (pathHasPrefix(lower, "/" + locale.toLowerCase())) return path;
    }
    // Add the locale prefix to the path.
    return addPathPrefix(path, "/" + locale);
} //# sourceMappingURL=add-locale.js.map

;// CONCATENATED MODULE: ./node_modules/next/dist/esm/shared/lib/router/utils/format-next-pathname-info.js




function formatNextPathnameInfo(info) {
    let pathname = addLocale(info.pathname, info.locale, info.buildId ? undefined : info.defaultLocale, info.ignorePrefix);
    if (info.buildId || !info.trailingSlash) {
        pathname = removeTrailingSlash(pathname);
    }
    if (info.buildId) {
        pathname = addPathSuffix(addPathPrefix(pathname, "/_next/data/" + info.buildId), info.pathname === "/" ? "index.json" : ".json");
    }
    pathname = addPathPrefix(pathname, info.basePath);
    return !info.buildId && info.trailingSlash ? !pathname.endsWith("/") ? addPathSuffix(pathname, "/") : pathname : removeTrailingSlash(pathname);
} //# sourceMappingURL=format-next-pathname-info.js.map

;// CONCATENATED MODULE: ./node_modules/next/dist/esm/shared/lib/get-hostname.js
/**
 * Takes an object with a hostname property (like a parsed URL) and some
 * headers that may contain Host and returns the preferred hostname.
 * @param parsed An object containing a hostname property.
 * @param headers A dictionary with headers containing a `host`.
 */ function getHostname(parsed, headers) {
    // Get the hostname from the headers if it exists, otherwise use the parsed
    // hostname.
    let hostname;
    if ((headers == null ? void 0 : headers.host) && !Array.isArray(headers.host)) {
        hostname = headers.host.toString().split(":")[0];
    } else if (parsed.hostname) {
        hostname = parsed.hostname;
    } else return;
    return hostname.toLowerCase();
} //# sourceMappingURL=get-hostname.js.map

;// CONCATENATED MODULE: ./node_modules/next/dist/esm/shared/lib/i18n/normalize-locale-path.js
/**
 * For a pathname that may include a locale from a list of locales, it
 * removes the locale from the pathname returning it alongside with the
 * detected locale.
 *
 * @param pathname A pathname that may include a locale.
 * @param locales A list of locales.
 * @returns The detected locale and pathname without locale
 */ function normalizeLocalePath(pathname, locales) {
    let detectedLocale;
    // first item will be empty string from splitting at first char
    const pathnameParts = pathname.split("/");
    (locales || []).some((locale)=>{
        if (pathnameParts[1] && pathnameParts[1].toLowerCase() === locale.toLowerCase()) {
            detectedLocale = locale;
            pathnameParts.splice(1, 1);
            pathname = pathnameParts.join("/") || "/";
            return true;
        }
        return false;
    });
    return {
        pathname,
        detectedLocale
    };
} //# sourceMappingURL=normalize-locale-path.js.map

;// CONCATENATED MODULE: ./node_modules/next/dist/esm/shared/lib/router/utils/remove-path-prefix.js

/**
 * Given a path and a prefix it will remove the prefix when it exists in the
 * given path. It ensures it matches exactly without containing extra chars
 * and if the prefix is not there it will be noop.
 *
 * @param path The path to remove the prefix from.
 * @param prefix The prefix to be removed.
 */ function removePathPrefix(path, prefix) {
    // If the path doesn't start with the prefix we can return it as is. This
    // protects us from situations where the prefix is a substring of the path
    // prefix such as:
    //
    // For prefix: /blog
    //
    //   /blog -> true
    //   /blog/ -> true
    //   /blog/1 -> true
    //   /blogging -> false
    //   /blogging/ -> false
    //   /blogging/1 -> false
    if (!pathHasPrefix(path, prefix)) {
        return path;
    }
    // Remove the prefix from the path via slicing.
    const withoutPrefix = path.slice(prefix.length);
    // If the path without the prefix starts with a `/` we can return it as is.
    if (withoutPrefix.startsWith("/")) {
        return withoutPrefix;
    }
    // If the path without the prefix doesn't start with a `/` we need to add it
    // back to the path to make sure it's a valid path.
    return "/" + withoutPrefix;
} //# sourceMappingURL=remove-path-prefix.js.map

;// CONCATENATED MODULE: ./node_modules/next/dist/esm/shared/lib/router/utils/get-next-pathname-info.js



function getNextPathnameInfo(pathname, options) {
    var _options_nextConfig;
    const { basePath, i18n, trailingSlash } = (_options_nextConfig = options.nextConfig) != null ? _options_nextConfig : {};
    const info = {
        pathname,
        trailingSlash: pathname !== "/" ? pathname.endsWith("/") : trailingSlash
    };
    if (basePath && pathHasPrefix(info.pathname, basePath)) {
        info.pathname = removePathPrefix(info.pathname, basePath);
        info.basePath = basePath;
    }
    let pathnameNoDataPrefix = info.pathname;
    if (info.pathname.startsWith("/_next/data/") && info.pathname.endsWith(".json")) {
        const paths = info.pathname.replace(/^\/_next\/data\//, "").replace(/\.json$/, "").split("/");
        const buildId = paths[0];
        info.buildId = buildId;
        pathnameNoDataPrefix = paths[1] !== "index" ? "/" + paths.slice(1).join("/") : "/";
        // update pathname with normalized if enabled although
        // we use normalized to populate locale info still
        if (options.parseData === true) {
            info.pathname = pathnameNoDataPrefix;
        }
    }
    // If provided, use the locale route normalizer to detect the locale instead
    // of the function below.
    if (i18n) {
        let result = options.i18nProvider ? options.i18nProvider.analyze(info.pathname) : normalizeLocalePath(info.pathname, i18n.locales);
        info.locale = result.detectedLocale;
        var _result_pathname;
        info.pathname = (_result_pathname = result.pathname) != null ? _result_pathname : info.pathname;
        if (!result.detectedLocale && info.buildId) {
            result = options.i18nProvider ? options.i18nProvider.analyze(pathnameNoDataPrefix) : normalizeLocalePath(pathnameNoDataPrefix, i18n.locales);
            if (result.detectedLocale) {
                info.locale = result.detectedLocale;
            }
        }
    }
    return info;
} //# sourceMappingURL=get-next-pathname-info.js.map

;// CONCATENATED MODULE: ./node_modules/next/dist/esm/server/web/next-url.js




const REGEX_LOCALHOST_HOSTNAME = /(?!^https?:\/\/)(127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}|\[::1\]|localhost)/;
function parseURL(url, base) {
    return new URL(String(url).replace(REGEX_LOCALHOST_HOSTNAME, "localhost"), base && String(base).replace(REGEX_LOCALHOST_HOSTNAME, "localhost"));
}
const Internal = Symbol("NextURLInternal");
class NextURL {
    constructor(input, baseOrOpts, opts){
        let base;
        let options;
        if (typeof baseOrOpts === "object" && "pathname" in baseOrOpts || typeof baseOrOpts === "string") {
            base = baseOrOpts;
            options = opts || {};
        } else {
            options = opts || baseOrOpts || {};
        }
        this[Internal] = {
            url: parseURL(input, base ?? options.base),
            options: options,
            basePath: ""
        };
        this.analyze();
    }
    analyze() {
        var _this_Internal_options_nextConfig_i18n, _this_Internal_options_nextConfig, _this_Internal_domainLocale, _this_Internal_options_nextConfig_i18n1, _this_Internal_options_nextConfig1;
        const info = getNextPathnameInfo(this[Internal].url.pathname, {
            nextConfig: this[Internal].options.nextConfig,
            parseData: !undefined,
            i18nProvider: this[Internal].options.i18nProvider
        });
        const hostname = getHostname(this[Internal].url, this[Internal].options.headers);
        this[Internal].domainLocale = this[Internal].options.i18nProvider ? this[Internal].options.i18nProvider.detectDomainLocale(hostname) : detectDomainLocale((_this_Internal_options_nextConfig = this[Internal].options.nextConfig) == null ? void 0 : (_this_Internal_options_nextConfig_i18n = _this_Internal_options_nextConfig.i18n) == null ? void 0 : _this_Internal_options_nextConfig_i18n.domains, hostname);
        const defaultLocale = ((_this_Internal_domainLocale = this[Internal].domainLocale) == null ? void 0 : _this_Internal_domainLocale.defaultLocale) || ((_this_Internal_options_nextConfig1 = this[Internal].options.nextConfig) == null ? void 0 : (_this_Internal_options_nextConfig_i18n1 = _this_Internal_options_nextConfig1.i18n) == null ? void 0 : _this_Internal_options_nextConfig_i18n1.defaultLocale);
        this[Internal].url.pathname = info.pathname;
        this[Internal].defaultLocale = defaultLocale;
        this[Internal].basePath = info.basePath ?? "";
        this[Internal].buildId = info.buildId;
        this[Internal].locale = info.locale ?? defaultLocale;
        this[Internal].trailingSlash = info.trailingSlash;
    }
    formatPathname() {
        return formatNextPathnameInfo({
            basePath: this[Internal].basePath,
            buildId: this[Internal].buildId,
            defaultLocale: !this[Internal].options.forceLocale ? this[Internal].defaultLocale : undefined,
            locale: this[Internal].locale,
            pathname: this[Internal].url.pathname,
            trailingSlash: this[Internal].trailingSlash
        });
    }
    formatSearch() {
        return this[Internal].url.search;
    }
    get buildId() {
        return this[Internal].buildId;
    }
    set buildId(buildId) {
        this[Internal].buildId = buildId;
    }
    get locale() {
        return this[Internal].locale ?? "";
    }
    set locale(locale) {
        var _this_Internal_options_nextConfig_i18n, _this_Internal_options_nextConfig;
        if (!this[Internal].locale || !((_this_Internal_options_nextConfig = this[Internal].options.nextConfig) == null ? void 0 : (_this_Internal_options_nextConfig_i18n = _this_Internal_options_nextConfig.i18n) == null ? void 0 : _this_Internal_options_nextConfig_i18n.locales.includes(locale))) {
            throw new TypeError(`The NextURL configuration includes no locale "${locale}"`);
        }
        this[Internal].locale = locale;
    }
    get defaultLocale() {
        return this[Internal].defaultLocale;
    }
    get domainLocale() {
        return this[Internal].domainLocale;
    }
    get searchParams() {
        return this[Internal].url.searchParams;
    }
    get host() {
        return this[Internal].url.host;
    }
    set host(value) {
        this[Internal].url.host = value;
    }
    get hostname() {
        return this[Internal].url.hostname;
    }
    set hostname(value) {
        this[Internal].url.hostname = value;
    }
    get port() {
        return this[Internal].url.port;
    }
    set port(value) {
        this[Internal].url.port = value;
    }
    get protocol() {
        return this[Internal].url.protocol;
    }
    set protocol(value) {
        this[Internal].url.protocol = value;
    }
    get href() {
        const pathname = this.formatPathname();
        const search = this.formatSearch();
        return `${this.protocol}//${this.host}${pathname}${search}${this.hash}`;
    }
    set href(url) {
        this[Internal].url = parseURL(url);
        this.analyze();
    }
    get origin() {
        return this[Internal].url.origin;
    }
    get pathname() {
        return this[Internal].url.pathname;
    }
    set pathname(value) {
        this[Internal].url.pathname = value;
    }
    get hash() {
        return this[Internal].url.hash;
    }
    set hash(value) {
        this[Internal].url.hash = value;
    }
    get search() {
        return this[Internal].url.search;
    }
    set search(value) {
        this[Internal].url.search = value;
    }
    get password() {
        return this[Internal].url.password;
    }
    set password(value) {
        this[Internal].url.password = value;
    }
    get username() {
        return this[Internal].url.username;
    }
    set username(value) {
        this[Internal].url.username = value;
    }
    get basePath() {
        return this[Internal].basePath;
    }
    set basePath(value) {
        this[Internal].basePath = value.startsWith("/") ? value : `/${value}`;
    }
    toString() {
        return this.href;
    }
    toJSON() {
        return this.href;
    }
    [Symbol.for("edge-runtime.inspect.custom")]() {
        return {
            href: this.href,
            origin: this.origin,
            protocol: this.protocol,
            username: this.username,
            password: this.password,
            host: this.host,
            hostname: this.hostname,
            port: this.port,
            pathname: this.pathname,
            search: this.search,
            searchParams: this.searchParams,
            hash: this.hash
        };
    }
    clone() {
        return new NextURL(String(this), this[Internal].options);
    }
} //# sourceMappingURL=next-url.js.map

// EXTERNAL MODULE: ./node_modules/next/dist/compiled/@edge-runtime/cookies/index.js
var _edge_runtime_cookies = __webpack_require__(929);
;// CONCATENATED MODULE: ./node_modules/next/dist/esm/server/web/spec-extension/cookies.js
 //# sourceMappingURL=cookies.js.map

;// CONCATENATED MODULE: ./node_modules/next/dist/esm/server/web/spec-extension/request.js




const INTERNALS = Symbol("internal request");
class NextRequest extends Request {
    constructor(input, init = {}){
        const url = typeof input !== "string" && "url" in input ? input.url : String(input);
        validateURL(url);
        if (input instanceof Request) super(input, init);
        else super(url, init);
        const nextUrl = new NextURL(url, {
            headers: toNodeOutgoingHttpHeaders(this.headers),
            nextConfig: init.nextConfig
        });
        this[INTERNALS] = {
            cookies: new _edge_runtime_cookies.RequestCookies(this.headers),
            geo: init.geo || {},
            ip: init.ip,
            nextUrl,
            url:  false ? 0 : nextUrl.toString()
        };
    }
    [Symbol.for("edge-runtime.inspect.custom")]() {
        return {
            cookies: this.cookies,
            geo: this.geo,
            ip: this.ip,
            nextUrl: this.nextUrl,
            url: this.url,
            // rest of props come from Request
            bodyUsed: this.bodyUsed,
            cache: this.cache,
            credentials: this.credentials,
            destination: this.destination,
            headers: Object.fromEntries(this.headers),
            integrity: this.integrity,
            keepalive: this.keepalive,
            method: this.method,
            mode: this.mode,
            redirect: this.redirect,
            referrer: this.referrer,
            referrerPolicy: this.referrerPolicy,
            signal: this.signal
        };
    }
    get cookies() {
        return this[INTERNALS].cookies;
    }
    get geo() {
        return this[INTERNALS].geo;
    }
    get ip() {
        return this[INTERNALS].ip;
    }
    get nextUrl() {
        return this[INTERNALS].nextUrl;
    }
    /**
   * @deprecated
   * `page` has been deprecated in favour of `URLPattern`.
   * Read more: https://nextjs.org/docs/messages/middleware-request-page
   */ get page() {
        throw new RemovedPageError();
    }
    /**
   * @deprecated
   * `ua` has been removed in favour of \`userAgent\` function.
   * Read more: https://nextjs.org/docs/messages/middleware-parse-user-agent
   */ get ua() {
        throw new RemovedUAError();
    }
    get url() {
        return this[INTERNALS].url;
    }
} //# sourceMappingURL=request.js.map

;// CONCATENATED MODULE: ./node_modules/next/dist/esm/server/web/spec-extension/response.js



const response_INTERNALS = Symbol("internal response");
const REDIRECTS = new Set([
    301,
    302,
    303,
    307,
    308
]);
function handleMiddlewareField(init, headers) {
    var _init_request;
    if (init == null ? void 0 : (_init_request = init.request) == null ? void 0 : _init_request.headers) {
        if (!(init.request.headers instanceof Headers)) {
            throw new Error("request.headers must be an instance of Headers");
        }
        const keys = [];
        for (const [key, value] of init.request.headers){
            headers.set("x-middleware-request-" + key, value);
            keys.push(key);
        }
        headers.set("x-middleware-override-headers", keys.join(","));
    }
}
class NextResponse extends Response {
    constructor(body, init = {}){
        super(body, init);
        this[response_INTERNALS] = {
            cookies: new _edge_runtime_cookies.ResponseCookies(this.headers),
            url: init.url ? new NextURL(init.url, {
                headers: toNodeOutgoingHttpHeaders(this.headers),
                nextConfig: init.nextConfig
            }) : undefined
        };
    }
    [Symbol.for("edge-runtime.inspect.custom")]() {
        return {
            cookies: this.cookies,
            url: this.url,
            // rest of props come from Response
            body: this.body,
            bodyUsed: this.bodyUsed,
            headers: Object.fromEntries(this.headers),
            ok: this.ok,
            redirected: this.redirected,
            status: this.status,
            statusText: this.statusText,
            type: this.type
        };
    }
    get cookies() {
        return this[response_INTERNALS].cookies;
    }
    static json(body, init) {
        const response = Response.json(body, init);
        return new NextResponse(response.body, response);
    }
    static redirect(url, init) {
        const status = typeof init === "number" ? init : (init == null ? void 0 : init.status) ?? 307;
        if (!REDIRECTS.has(status)) {
            throw new RangeError('Failed to execute "redirect" on "response": Invalid status code');
        }
        const initObj = typeof init === "object" ? init : {};
        const headers = new Headers(initObj == null ? void 0 : initObj.headers);
        headers.set("Location", validateURL(url));
        return new NextResponse(null, {
            ...initObj,
            headers,
            status
        });
    }
    static rewrite(destination, init) {
        const headers = new Headers(init == null ? void 0 : init.headers);
        headers.set("x-middleware-rewrite", validateURL(destination));
        handleMiddlewareField(init, headers);
        return new NextResponse(null, {
            ...init,
            headers
        });
    }
    static next(init) {
        const headers = new Headers(init == null ? void 0 : init.headers);
        headers.set("x-middleware-next", "1");
        handleMiddlewareField(init, headers);
        return new NextResponse(null, {
            ...init,
            headers
        });
    }
} //# sourceMappingURL=response.js.map

;// CONCATENATED MODULE: ./node_modules/next/dist/esm/shared/lib/router/utils/relativize-url.js
/**
 * Given a URL as a string and a base URL it will make the URL relative
 * if the parsed protocol and host is the same as the one in the base
 * URL. Otherwise it returns the same URL string.
 */ function relativizeURL(url, base) {
    const baseURL = typeof base === "string" ? new URL(base) : base;
    const relative = new URL(url, base);
    const origin = baseURL.protocol + "//" + baseURL.host;
    return relative.protocol + "//" + relative.host === origin ? relative.toString().replace(origin, "") : relative.toString();
} //# sourceMappingURL=relativize-url.js.map

;// CONCATENATED MODULE: ./node_modules/next/dist/esm/client/components/app-router-headers.js
const RSC = "RSC";
const ACTION = "Next-Action";
const NEXT_ROUTER_STATE_TREE = "Next-Router-State-Tree";
const NEXT_ROUTER_PREFETCH = "Next-Router-Prefetch";
const NEXT_URL = "Next-Url";
const RSC_CONTENT_TYPE_HEADER = "text/x-component";
const RSC_VARY_HEADER = RSC + ", " + NEXT_ROUTER_STATE_TREE + ", " + NEXT_ROUTER_PREFETCH + ", " + NEXT_URL;
const FLIGHT_PARAMETERS = [
    [
        RSC
    ],
    [
        NEXT_ROUTER_STATE_TREE
    ],
    [
        NEXT_ROUTER_PREFETCH
    ]
];
const NEXT_RSC_UNION_QUERY = "_rsc"; //# sourceMappingURL=app-router-headers.js.map

;// CONCATENATED MODULE: ./node_modules/next/dist/esm/server/internal-utils.js

const INTERNAL_QUERY_NAMES = [
    "__nextFallback",
    "__nextLocale",
    "__nextInferredLocaleFromDefault",
    "__nextDefaultLocale",
    "__nextIsNotFound",
    NEXT_RSC_UNION_QUERY
];
const EDGE_EXTENDED_INTERNAL_QUERY_NAMES = [
    "__nextDataReq"
];
function stripInternalQueries(query) {
    for (const name of INTERNAL_QUERY_NAMES){
        delete query[name];
    }
}
function stripInternalSearchParams(url, isEdge) {
    const isStringUrl = typeof url === "string";
    const instance = isStringUrl ? new URL(url) : url;
    for (const name of INTERNAL_QUERY_NAMES){
        instance.searchParams.delete(name);
    }
    if (isEdge) {
        for (const name of EDGE_EXTENDED_INTERNAL_QUERY_NAMES){
            instance.searchParams.delete(name);
        }
    }
    return isStringUrl ? instance.toString() : instance;
}
/**
 * Headers that are set by the Next.js server and should be stripped from the
 * request headers going to the user's application.
 */ const INTERNAL_HEADERS = (/* unused pure expression or super */ null && ([
    "x-invoke-path",
    "x-invoke-status",
    "x-invoke-error",
    "x-invoke-query",
    "x-invoke-output",
    "x-middleware-invoke"
]));
/**
 * Strip internal headers from the request headers.
 *
 * @param headers the headers to strip of internal headers
 */ function stripInternalHeaders(headers) {
    for (const key of INTERNAL_HEADERS){
        delete headers[key];
    }
} //# sourceMappingURL=internal-utils.js.map

;// CONCATENATED MODULE: ./node_modules/next/dist/esm/shared/lib/router/utils/app-paths.js


/**
 * Normalizes an app route so it represents the actual request path. Essentially
 * performing the following transformations:
 *
 * - `/(dashboard)/user/[id]/page` to `/user/[id]`
 * - `/(dashboard)/account/page` to `/account`
 * - `/user/[id]/page` to `/user/[id]`
 * - `/account/page` to `/account`
 * - `/page` to `/`
 * - `/(dashboard)/user/[id]/route` to `/user/[id]`
 * - `/(dashboard)/account/route` to `/account`
 * - `/user/[id]/route` to `/user/[id]`
 * - `/account/route` to `/account`
 * - `/route` to `/`
 * - `/` to `/`
 *
 * @param route the app route to normalize
 * @returns the normalized pathname
 */ function normalizeAppPath(route) {
    return ensureLeadingSlash(route.split("/").reduce((pathname, segment, index, segments)=>{
        // Empty segments are ignored.
        if (!segment) {
            return pathname;
        }
        // Groups are ignored.
        if (isGroupSegment(segment)) {
            return pathname;
        }
        // Parallel segments are ignored.
        if (segment[0] === "@") {
            return pathname;
        }
        // The last segment (if it's a leaf) should be ignored.
        if ((segment === "page" || segment === "route") && index === segments.length - 1) {
            return pathname;
        }
        return pathname + "/" + segment;
    }, ""));
}
/**
 * Strips the `.rsc` extension if it's in the pathname.
 * Since this function is used on full urls it checks `?` for searchParams handling.
 */ function normalizeRscPath(pathname, enabled) {
    return enabled ? pathname.replace(/\.rsc($|\?)/, "$1") : pathname;
} //# sourceMappingURL=app-paths.js.map

;// CONCATENATED MODULE: ./node_modules/next/dist/esm/lib/constants.js
const NEXT_QUERY_PARAM_PREFIX = "nxtP";
const PRERENDER_REVALIDATE_HEADER = "x-prerender-revalidate";
const PRERENDER_REVALIDATE_ONLY_GENERATED_HEADER = "x-prerender-revalidate-if-generated";
const NEXT_CACHE_TAGS_HEADER = "x-next-cache-tags";
const NEXT_CACHE_SOFT_TAGS_HEADER = "x-next-cache-soft-tags";
const NEXT_CACHE_REVALIDATED_TAGS_HEADER = "x-next-revalidated-tags";
const NEXT_CACHE_REVALIDATE_TAG_TOKEN_HEADER = "x-next-revalidate-tag-token";
const NEXT_CACHE_TAG_MAX_LENGTH = 256;
const NEXT_CACHE_SOFT_TAG_MAX_LENGTH = 1024;
const NEXT_CACHE_IMPLICIT_TAG_ID = "_N_T_";
// in seconds
const CACHE_ONE_YEAR = 31536000;
// Patterns to detect middleware files
const MIDDLEWARE_FILENAME = "middleware";
const MIDDLEWARE_LOCATION_REGEXP = (/* unused pure expression or super */ null && (`(?:src/)?${MIDDLEWARE_FILENAME}`));
// Pattern to detect instrumentation hooks file
const INSTRUMENTATION_HOOK_FILENAME = "instrumentation";
// Because on Windows absolute paths in the generated code can break because of numbers, eg 1 in the path,
// we have to use a private alias
const PAGES_DIR_ALIAS = "private-next-pages";
const DOT_NEXT_ALIAS = "private-dot-next";
const ROOT_DIR_ALIAS = "private-next-root-dir";
const APP_DIR_ALIAS = "private-next-app-dir";
const RSC_MOD_REF_PROXY_ALIAS = "private-next-rsc-mod-ref-proxy";
const RSC_ACTION_VALIDATE_ALIAS = "private-next-rsc-action-validate";
const RSC_ACTION_PROXY_ALIAS = "private-next-rsc-action-proxy";
const RSC_ACTION_CLIENT_WRAPPER_ALIAS = "private-next-rsc-action-client-wrapper";
const PUBLIC_DIR_MIDDLEWARE_CONFLICT = (/* unused pure expression or super */ null && (`You can not have a '_next' folder inside of your public folder. This conflicts with the internal '/_next' route. https://nextjs.org/docs/messages/public-next-folder-conflict`));
const SSG_GET_INITIAL_PROPS_CONFLICT = (/* unused pure expression or super */ null && (`You can not use getInitialProps with getStaticProps. To use SSG, please remove your getInitialProps`));
const SERVER_PROPS_GET_INIT_PROPS_CONFLICT = (/* unused pure expression or super */ null && (`You can not use getInitialProps with getServerSideProps. Please remove getInitialProps.`));
const SERVER_PROPS_SSG_CONFLICT = (/* unused pure expression or super */ null && (`You can not use getStaticProps or getStaticPaths with getServerSideProps. To use SSG, please remove getServerSideProps`));
const STATIC_STATUS_PAGE_GET_INITIAL_PROPS_ERROR = (/* unused pure expression or super */ null && (`can not have getInitialProps/getServerSideProps, https://nextjs.org/docs/messages/404-get-initial-props`));
const SERVER_PROPS_EXPORT_ERROR = (/* unused pure expression or super */ null && (`pages with \`getServerSideProps\` can not be exported. See more info here: https://nextjs.org/docs/messages/gssp-export`));
const GSP_NO_RETURNED_VALUE = "Your `getStaticProps` function did not return an object. Did you forget to add a `return`?";
const GSSP_NO_RETURNED_VALUE = "Your `getServerSideProps` function did not return an object. Did you forget to add a `return`?";
const UNSTABLE_REVALIDATE_RENAME_ERROR = (/* unused pure expression or super */ null && ("The `unstable_revalidate` property is available for general use.\n" + "Please use `revalidate` instead."));
const GSSP_COMPONENT_MEMBER_ERROR = (/* unused pure expression or super */ null && (`can not be attached to a page's component and must be exported from the page. See more info here: https://nextjs.org/docs/messages/gssp-component-member`));
const NON_STANDARD_NODE_ENV = (/* unused pure expression or super */ null && (`You are using a non-standard "NODE_ENV" value in your environment. This creates inconsistencies in the project and is strongly advised against. Read more: https://nextjs.org/docs/messages/non-standard-node-env`));
const SSG_FALLBACK_EXPORT_ERROR = (/* unused pure expression or super */ null && (`Pages with \`fallback\` enabled in \`getStaticPaths\` can not be exported. See more info here: https://nextjs.org/docs/messages/ssg-fallback-true-export`));
const ESLINT_DEFAULT_DIRS = (/* unused pure expression or super */ null && ([
    "app",
    "pages",
    "components",
    "lib",
    "src"
]));
const ESLINT_PROMPT_VALUES = [
    {
        title: "Strict",
        recommended: true,
        config: {
            extends: "next/core-web-vitals"
        }
    },
    {
        title: "Base",
        config: {
            extends: "next"
        }
    },
    {
        title: "Cancel",
        config: null
    }
];
const SERVER_RUNTIME = {
    edge: "edge",
    experimentalEdge: "experimental-edge",
    nodejs: "nodejs"
};
/**
 * The names of the webpack layers. These layers are the primitives for the
 * webpack chunks.
 */ const WEBPACK_LAYERS_NAMES = {
    /**
   * The layer for the shared code between the client and server bundles.
   */ shared: "shared",
    /**
   * React Server Components layer (rsc).
   */ reactServerComponents: "rsc",
    /**
   * Server Side Rendering layer for app (ssr).
   */ serverSideRendering: "ssr",
    /**
   * The browser client bundle layer for actions.
   */ actionBrowser: "action-browser",
    /**
   * The layer for the API routes.
   */ api: "api",
    /**
   * The layer for the middleware code.
   */ middleware: "middleware",
    /**
   * The layer for assets on the edge.
   */ edgeAsset: "edge-asset",
    /**
   * The browser client bundle layer for App directory.
   */ appPagesBrowser: "app-pages-browser",
    /**
   * The server bundle layer for metadata routes.
   */ appMetadataRoute: "app-metadata-route",
    /**
   * The layer for the server bundle for App Route handlers.
   */ appRouteHandler: "app-route-handler"
};
const WEBPACK_LAYERS = {
    ...WEBPACK_LAYERS_NAMES,
    GROUP: {
        server: [
            WEBPACK_LAYERS_NAMES.reactServerComponents,
            WEBPACK_LAYERS_NAMES.actionBrowser,
            WEBPACK_LAYERS_NAMES.appMetadataRoute,
            WEBPACK_LAYERS_NAMES.appRouteHandler
        ],
        nonClientServerTarget: [
            // plus middleware and pages api
            WEBPACK_LAYERS_NAMES.middleware,
            WEBPACK_LAYERS_NAMES.api
        ],
        app: [
            WEBPACK_LAYERS_NAMES.reactServerComponents,
            WEBPACK_LAYERS_NAMES.actionBrowser,
            WEBPACK_LAYERS_NAMES.appMetadataRoute,
            WEBPACK_LAYERS_NAMES.appRouteHandler,
            WEBPACK_LAYERS_NAMES.serverSideRendering,
            WEBPACK_LAYERS_NAMES.appPagesBrowser
        ]
    }
};
const WEBPACK_RESOURCE_QUERIES = {
    edgeSSREntry: "__next_edge_ssr_entry__",
    metadata: "__next_metadata__",
    metadataRoute: "__next_metadata_route__",
    metadataImageMeta: "__next_metadata_image_meta__"
};
 //# sourceMappingURL=constants.js.map

;// CONCATENATED MODULE: ./node_modules/next/dist/esm/server/web/spec-extension/adapters/reflect.js
class ReflectAdapter {
    static get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);
        if (typeof value === "function") {
            return value.bind(target);
        }
        return value;
    }
    static set(target, prop, value, receiver) {
        return Reflect.set(target, prop, value, receiver);
    }
    static has(target, prop) {
        return Reflect.has(target, prop);
    }
    static deleteProperty(target, prop) {
        return Reflect.deleteProperty(target, prop);
    }
} //# sourceMappingURL=reflect.js.map

;// CONCATENATED MODULE: ./node_modules/next/dist/esm/server/web/spec-extension/adapters/headers.js

/**
 * @internal
 */ class ReadonlyHeadersError extends Error {
    constructor(){
        super("Headers cannot be modified. Read more: https://nextjs.org/docs/app/api-reference/functions/headers");
    }
    static callable() {
        throw new ReadonlyHeadersError();
    }
}
class HeadersAdapter extends Headers {
    constructor(headers){
        // We've already overridden the methods that would be called, so we're just
        // calling the super constructor to ensure that the instanceof check works.
        super();
        this.headers = new Proxy(headers, {
            get (target, prop, receiver) {
                // Because this is just an object, we expect that all "get" operations
                // are for properties. If it's a "get" for a symbol, we'll just return
                // the symbol.
                if (typeof prop === "symbol") {
                    return ReflectAdapter.get(target, prop, receiver);
                }
                const lowercased = prop.toLowerCase();
                // Let's find the original casing of the key. This assumes that there is
                // no mixed case keys (e.g. "Content-Type" and "content-type") in the
                // headers object.
                const original = Object.keys(headers).find((o)=>o.toLowerCase() === lowercased);
                // If the original casing doesn't exist, return undefined.
                if (typeof original === "undefined") return;
                // If the original casing exists, return the value.
                return ReflectAdapter.get(target, original, receiver);
            },
            set (target, prop, value, receiver) {
                if (typeof prop === "symbol") {
                    return ReflectAdapter.set(target, prop, value, receiver);
                }
                const lowercased = prop.toLowerCase();
                // Let's find the original casing of the key. This assumes that there is
                // no mixed case keys (e.g. "Content-Type" and "content-type") in the
                // headers object.
                const original = Object.keys(headers).find((o)=>o.toLowerCase() === lowercased);
                // If the original casing doesn't exist, use the prop as the key.
                return ReflectAdapter.set(target, original ?? prop, value, receiver);
            },
            has (target, prop) {
                if (typeof prop === "symbol") return ReflectAdapter.has(target, prop);
                const lowercased = prop.toLowerCase();
                // Let's find the original casing of the key. This assumes that there is
                // no mixed case keys (e.g. "Content-Type" and "content-type") in the
                // headers object.
                const original = Object.keys(headers).find((o)=>o.toLowerCase() === lowercased);
                // If the original casing doesn't exist, return false.
                if (typeof original === "undefined") return false;
                // If the original casing exists, return true.
                return ReflectAdapter.has(target, original);
            },
            deleteProperty (target, prop) {
                if (typeof prop === "symbol") return ReflectAdapter.deleteProperty(target, prop);
                const lowercased = prop.toLowerCase();
                // Let's find the original casing of the key. This assumes that there is
                // no mixed case keys (e.g. "Content-Type" and "content-type") in the
                // headers object.
                const original = Object.keys(headers).find((o)=>o.toLowerCase() === lowercased);
                // If the original casing doesn't exist, return true.
                if (typeof original === "undefined") return true;
                // If the original casing exists, delete the property.
                return ReflectAdapter.deleteProperty(target, original);
            }
        });
    }
    /**
   * Seals a Headers instance to prevent modification by throwing an error when
   * any mutating method is called.
   */ static seal(headers) {
        return new Proxy(headers, {
            get (target, prop, receiver) {
                switch(prop){
                    case "append":
                    case "delete":
                    case "set":
                        return ReadonlyHeadersError.callable;
                    default:
                        return ReflectAdapter.get(target, prop, receiver);
                }
            }
        });
    }
    /**
   * Merges a header value into a string. This stores multiple values as an
   * array, so we need to merge them into a string.
   *
   * @param value a header value
   * @returns a merged header value (a string)
   */ merge(value) {
        if (Array.isArray(value)) return value.join(", ");
        return value;
    }
    /**
   * Creates a Headers instance from a plain object or a Headers instance.
   *
   * @param headers a plain object or a Headers instance
   * @returns a headers instance
   */ static from(headers) {
        if (headers instanceof Headers) return headers;
        return new HeadersAdapter(headers);
    }
    append(name, value) {
        const existing = this.headers[name];
        if (typeof existing === "string") {
            this.headers[name] = [
                existing,
                value
            ];
        } else if (Array.isArray(existing)) {
            existing.push(value);
        } else {
            this.headers[name] = value;
        }
    }
    delete(name) {
        delete this.headers[name];
    }
    get(name) {
        const value = this.headers[name];
        if (typeof value !== "undefined") return this.merge(value);
        return null;
    }
    has(name) {
        return typeof this.headers[name] !== "undefined";
    }
    set(name, value) {
        this.headers[name] = value;
    }
    forEach(callbackfn, thisArg) {
        for (const [name, value] of this.entries()){
            callbackfn.call(thisArg, value, name, this);
        }
    }
    *entries() {
        for (const key of Object.keys(this.headers)){
            const name = key.toLowerCase();
            // We assert here that this is a string because we got it from the
            // Object.keys() call above.
            const value = this.get(name);
            yield [
                name,
                value
            ];
        }
    }
    *keys() {
        for (const key of Object.keys(this.headers)){
            const name = key.toLowerCase();
            yield name;
        }
    }
    *values() {
        for (const key of Object.keys(this.headers)){
            // We assert here that this is a string because we got it from the
            // Object.keys() call above.
            const value = this.get(key);
            yield value;
        }
    }
    [Symbol.iterator]() {
        return this.entries();
    }
} //# sourceMappingURL=headers.js.map

;// CONCATENATED MODULE: ./node_modules/next/dist/esm/server/web/spec-extension/adapters/request-cookies.js


/**
 * @internal
 */ class ReadonlyRequestCookiesError extends Error {
    constructor(){
        super("Cookies can only be modified in a Server Action or Route Handler. Read more: https://nextjs.org/docs/app/api-reference/functions/cookies#cookiessetname-value-options");
    }
    static callable() {
        throw new ReadonlyRequestCookiesError();
    }
}
class RequestCookiesAdapter {
    static seal(cookies) {
        return new Proxy(cookies, {
            get (target, prop, receiver) {
                switch(prop){
                    case "clear":
                    case "delete":
                    case "set":
                        return ReadonlyRequestCookiesError.callable;
                    default:
                        return ReflectAdapter.get(target, prop, receiver);
                }
            }
        });
    }
}
const SYMBOL_MODIFY_COOKIE_VALUES = Symbol.for("next.mutated.cookies");
function getModifiedCookieValues(cookies) {
    const modified = cookies[SYMBOL_MODIFY_COOKIE_VALUES];
    if (!modified || !Array.isArray(modified) || modified.length === 0) {
        return [];
    }
    return modified;
}
function appendMutableCookies(headers, mutableCookies) {
    const modifiedCookieValues = getModifiedCookieValues(mutableCookies);
    if (modifiedCookieValues.length === 0) {
        return false;
    }
    // Return a new response that extends the response with
    // the modified cookies as fallbacks. `res` cookies
    // will still take precedence.
    const resCookies = new ResponseCookies(headers);
    const returnedCookies = resCookies.getAll();
    // Set the modified cookies as fallbacks.
    for (const cookie of modifiedCookieValues){
        resCookies.set(cookie);
    }
    // Set the original cookies as the final values.
    for (const cookie of returnedCookies){
        resCookies.set(cookie);
    }
    return true;
}
class MutableRequestCookiesAdapter {
    static wrap(cookies, onUpdateCookies) {
        const responseCookes = new _edge_runtime_cookies.ResponseCookies(new Headers());
        for (const cookie of cookies.getAll()){
            responseCookes.set(cookie);
        }
        let modifiedValues = [];
        const modifiedCookies = new Set();
        const updateResponseCookies = ()=>{
            var _fetch___nextGetStaticStore;
            // TODO-APP: change method of getting staticGenerationAsyncStore
            const staticGenerationAsyncStore = fetch.__nextGetStaticStore == null ? void 0 : (_fetch___nextGetStaticStore = fetch.__nextGetStaticStore.call(fetch)) == null ? void 0 : _fetch___nextGetStaticStore.getStore();
            if (staticGenerationAsyncStore) {
                staticGenerationAsyncStore.pathWasRevalidated = true;
            }
            const allCookies = responseCookes.getAll();
            modifiedValues = allCookies.filter((c)=>modifiedCookies.has(c.name));
            if (onUpdateCookies) {
                const serializedCookies = [];
                for (const cookie of modifiedValues){
                    const tempCookies = new _edge_runtime_cookies.ResponseCookies(new Headers());
                    tempCookies.set(cookie);
                    serializedCookies.push(tempCookies.toString());
                }
                onUpdateCookies(serializedCookies);
            }
        };
        return new Proxy(responseCookes, {
            get (target, prop, receiver) {
                switch(prop){
                    // A special symbol to get the modified cookie values
                    case SYMBOL_MODIFY_COOKIE_VALUES:
                        return modifiedValues;
                    // TODO: Throw error if trying to set a cookie after the response
                    // headers have been set.
                    case "delete":
                        return function(...args) {
                            modifiedCookies.add(typeof args[0] === "string" ? args[0] : args[0].name);
                            try {
                                target.delete(...args);
                            } finally{
                                updateResponseCookies();
                            }
                        };
                    case "set":
                        return function(...args) {
                            modifiedCookies.add(typeof args[0] === "string" ? args[0] : args[0].name);
                            try {
                                return target.set(...args);
                            } finally{
                                updateResponseCookies();
                            }
                        };
                    default:
                        return ReflectAdapter.get(target, prop, receiver);
                }
            }
        });
    }
} //# sourceMappingURL=request-cookies.js.map

;// CONCATENATED MODULE: ./node_modules/next/dist/esm/server/api-utils/index.js


/**
 *
 * @param res response object
 * @param statusCode `HTTP` status code of response
 */ function sendStatusCode(res, statusCode) {
    res.statusCode = statusCode;
    return res;
}
/**
 *
 * @param res response object
 * @param [statusOrUrl] `HTTP` status code of redirect
 * @param url URL of redirect
 */ function redirect(res, statusOrUrl, url) {
    if (typeof statusOrUrl === "string") {
        url = statusOrUrl;
        statusOrUrl = 307;
    }
    if (typeof statusOrUrl !== "number" || typeof url !== "string") {
        throw new Error(`Invalid redirect arguments. Please use a single argument URL, e.g. res.redirect('/destination') or use a status code and URL, e.g. res.redirect(307, '/destination').`);
    }
    res.writeHead(statusOrUrl, {
        Location: url
    });
    res.write(url);
    res.end();
    return res;
}
function checkIsOnDemandRevalidate(req, previewProps) {
    const headers = HeadersAdapter.from(req.headers);
    const previewModeId = headers.get(PRERENDER_REVALIDATE_HEADER);
    const isOnDemandRevalidate = previewModeId === previewProps.previewModeId;
    const revalidateOnlyGenerated = headers.has(PRERENDER_REVALIDATE_ONLY_GENERATED_HEADER);
    return {
        isOnDemandRevalidate,
        revalidateOnlyGenerated
    };
}
const COOKIE_NAME_PRERENDER_BYPASS = `__prerender_bypass`;
const COOKIE_NAME_PRERENDER_DATA = `__next_preview_data`;
const RESPONSE_LIMIT_DEFAULT = (/* unused pure expression or super */ null && (4 * 1024 * 1024));
const SYMBOL_PREVIEW_DATA = Symbol(COOKIE_NAME_PRERENDER_DATA);
const SYMBOL_CLEARED_COOKIES = Symbol(COOKIE_NAME_PRERENDER_BYPASS);
function clearPreviewData(res, options = {}) {
    if (SYMBOL_CLEARED_COOKIES in res) {
        return res;
    }
    const { serialize } = __webpack_require__(104);
    const previous = res.getHeader("Set-Cookie");
    res.setHeader(`Set-Cookie`, [
        ...typeof previous === "string" ? [
            previous
        ] : Array.isArray(previous) ? previous : [],
        serialize(COOKIE_NAME_PRERENDER_BYPASS, "", {
            // To delete a cookie, set `expires` to a date in the past:
            // https://tools.ietf.org/html/rfc6265#section-4.1.1
            // `Max-Age: 0` is not valid, thus ignored, and the cookie is persisted.
            expires: new Date(0),
            httpOnly: true,
            sameSite:  true ? "none" : 0,
            secure: "production" !== "development",
            path: "/",
            ...options.path !== undefined ? {
                path: options.path
            } : undefined
        }),
        serialize(COOKIE_NAME_PRERENDER_DATA, "", {
            // To delete a cookie, set `expires` to a date in the past:
            // https://tools.ietf.org/html/rfc6265#section-4.1.1
            // `Max-Age: 0` is not valid, thus ignored, and the cookie is persisted.
            expires: new Date(0),
            httpOnly: true,
            sameSite:  true ? "none" : 0,
            secure: "production" !== "development",
            path: "/",
            ...options.path !== undefined ? {
                path: options.path
            } : undefined
        })
    ]);
    Object.defineProperty(res, SYMBOL_CLEARED_COOKIES, {
        value: true,
        enumerable: false
    });
    return res;
}
/**
 * Custom error class
 */ class ApiError extends (/* unused pure expression or super */ null && (Error)) {
    constructor(statusCode, message){
        super(message);
        this.statusCode = statusCode;
    }
}
/**
 * Sends error in `response`
 * @param res response object
 * @param statusCode of response
 * @param message of response
 */ function sendError(res, statusCode, message) {
    res.statusCode = statusCode;
    res.statusMessage = message;
    res.end(message);
}
/**
 * Execute getter function only if its needed
 * @param LazyProps `req` and `params` for lazyProp
 * @param prop name of property
 * @param getter function to get data
 */ function setLazyProp({ req }, prop, getter) {
    const opts = {
        configurable: true,
        enumerable: true
    };
    const optsReset = {
        ...opts,
        writable: true
    };
    Object.defineProperty(req, prop, {
        ...opts,
        get: ()=>{
            const value = getter();
            // we set the property on the object to avoid recalculating it
            Object.defineProperty(req, prop, {
                ...optsReset,
                value
            });
            return value;
        },
        set: (value)=>{
            Object.defineProperty(req, prop, {
                ...optsReset,
                value
            });
        }
    });
} //# sourceMappingURL=index.js.map

;// CONCATENATED MODULE: ./node_modules/next/dist/esm/server/async-storage/draft-mode-provider.js

class DraftModeProvider {
    constructor(previewProps, req, cookies, mutableCookies){
        var _cookies_get;
        // The logic for draftMode() is very similar to tryGetPreviewData()
        // but Draft Mode does not have any data associated with it.
        const isOnDemandRevalidate = previewProps && checkIsOnDemandRevalidate(req, previewProps).isOnDemandRevalidate;
        const cookieValue = (_cookies_get = cookies.get(COOKIE_NAME_PRERENDER_BYPASS)) == null ? void 0 : _cookies_get.value;
        this.isEnabled = Boolean(!isOnDemandRevalidate && cookieValue && previewProps && cookieValue === previewProps.previewModeId);
        this._previewModeId = previewProps == null ? void 0 : previewProps.previewModeId;
        this._mutableCookies = mutableCookies;
    }
    enable() {
        if (!this._previewModeId) {
            throw new Error("Invariant: previewProps missing previewModeId this should never happen");
        }
        this._mutableCookies.set({
            name: COOKIE_NAME_PRERENDER_BYPASS,
            value: this._previewModeId,
            httpOnly: true,
            sameSite:  true ? "none" : 0,
            secure: "production" !== "development",
            path: "/"
        });
    }
    disable() {
        // To delete a cookie, set `expires` to a date in the past:
        // https://tools.ietf.org/html/rfc6265#section-4.1.1
        // `Max-Age: 0` is not valid, thus ignored, and the cookie is persisted.
        this._mutableCookies.set({
            name: COOKIE_NAME_PRERENDER_BYPASS,
            value: "",
            httpOnly: true,
            sameSite:  true ? "none" : 0,
            secure: "production" !== "development",
            path: "/",
            expires: new Date(0)
        });
    }
} //# sourceMappingURL=draft-mode-provider.js.map

;// CONCATENATED MODULE: ./node_modules/next/dist/esm/server/async-storage/request-async-storage-wrapper.js





function getHeaders(headers) {
    const cleaned = HeadersAdapter.from(headers);
    for (const param of FLIGHT_PARAMETERS){
        cleaned.delete(param.toString().toLowerCase());
    }
    return HeadersAdapter.seal(cleaned);
}
function getCookies(headers) {
    const cookies = new _edge_runtime_cookies.RequestCookies(HeadersAdapter.from(headers));
    return RequestCookiesAdapter.seal(cookies);
}
function getMutableCookies(headers, onUpdateCookies) {
    const cookies = new _edge_runtime_cookies.RequestCookies(HeadersAdapter.from(headers));
    return MutableRequestCookiesAdapter.wrap(cookies, onUpdateCookies);
}
const RequestAsyncStorageWrapper = {
    /**
   * Wrap the callback with the given store so it can access the underlying
   * store using hooks.
   *
   * @param storage underlying storage object returned by the module
   * @param context context to seed the store
   * @param callback function to call within the scope of the context
   * @returns the result returned by the callback
   */ wrap (storage, { req, res, renderOpts }, callback) {
        let previewProps = undefined;
        if (renderOpts && "previewProps" in renderOpts) {
            // TODO: investigate why previewProps isn't on RenderOpts
            previewProps = renderOpts.previewProps;
        }
        function defaultOnUpdateCookies(cookies) {
            if (res) {
                res.setHeader("Set-Cookie", cookies);
            }
        }
        const cache = {};
        const store = {
            get headers () {
                if (!cache.headers) {
                    // Seal the headers object that'll freeze out any methods that could
                    // mutate the underlying data.
                    cache.headers = getHeaders(req.headers);
                }
                return cache.headers;
            },
            get cookies () {
                if (!cache.cookies) {
                    // Seal the cookies object that'll freeze out any methods that could
                    // mutate the underlying data.
                    cache.cookies = getCookies(req.headers);
                }
                return cache.cookies;
            },
            get mutableCookies () {
                if (!cache.mutableCookies) {
                    cache.mutableCookies = getMutableCookies(req.headers, (renderOpts == null ? void 0 : renderOpts.onUpdateCookies) || (res ? defaultOnUpdateCookies : undefined));
                }
                return cache.mutableCookies;
            },
            get draftMode () {
                if (!cache.draftMode) {
                    cache.draftMode = new DraftModeProvider(previewProps, req, this.cookies, this.mutableCookies);
                }
                return cache.draftMode;
            }
        };
        return storage.run(store, callback, store);
    }
}; //# sourceMappingURL=request-async-storage-wrapper.js.map

;// CONCATENATED MODULE: ./node_modules/next/dist/esm/client/components/async-local-storage.js
const sharedAsyncLocalStorageNotAvailableError = new Error("Invariant: AsyncLocalStorage accessed in runtime where it is not available");
class FakeAsyncLocalStorage {
    disable() {
        throw sharedAsyncLocalStorageNotAvailableError;
    }
    getStore() {
        // This fake implementation of AsyncLocalStorage always returns `undefined`.
        return undefined;
    }
    run() {
        throw sharedAsyncLocalStorageNotAvailableError;
    }
    exit() {
        throw sharedAsyncLocalStorageNotAvailableError;
    }
    enterWith() {
        throw sharedAsyncLocalStorageNotAvailableError;
    }
}
const maybeGlobalAsyncLocalStorage = globalThis.AsyncLocalStorage;
function createAsyncLocalStorage() {
    if (maybeGlobalAsyncLocalStorage) {
        return new maybeGlobalAsyncLocalStorage();
    }
    return new FakeAsyncLocalStorage();
} //# sourceMappingURL=async-local-storage.js.map

;// CONCATENATED MODULE: ./node_modules/next/dist/esm/client/components/request-async-storage.external.js

const requestAsyncStorage = createAsyncLocalStorage(); //# sourceMappingURL=request-async-storage.external.js.map

;// CONCATENATED MODULE: ./node_modules/next/dist/esm/server/web/adapter.js















class NextRequestHint extends NextRequest {
    constructor(params){
        super(params.input, params.init);
        this.sourcePage = params.page;
    }
    get request() {
        throw new PageSignatureError({
            page: this.sourcePage
        });
    }
    respondWith() {
        throw new PageSignatureError({
            page: this.sourcePage
        });
    }
    waitUntil() {
        throw new PageSignatureError({
            page: this.sourcePage
        });
    }
}
const adapter_FLIGHT_PARAMETERS = [
    [
        RSC
    ],
    [
        NEXT_ROUTER_STATE_TREE
    ],
    [
        NEXT_ROUTER_PREFETCH
    ]
];
async function adapter(params) {
    await ensureInstrumentationRegistered();
    // TODO-APP: use explicit marker for this
    const isEdgeRendering = typeof self.__BUILD_MANIFEST !== "undefined";
    const prerenderManifest = typeof self.__PRERENDER_MANIFEST === "string" ? JSON.parse(self.__PRERENDER_MANIFEST) : undefined;
    params.request.url = normalizeRscPath(params.request.url, true);
    const requestUrl = new NextURL(params.request.url, {
        headers: params.request.headers,
        nextConfig: params.request.nextConfig
    });
    // Iterator uses an index to keep track of the current iteration. Because of deleting and appending below we can't just use the iterator.
    // Instead we use the keys before iteration.
    const keys = [
        ...requestUrl.searchParams.keys()
    ];
    for (const key of keys){
        const value = requestUrl.searchParams.getAll(key);
        if (key !== NEXT_QUERY_PARAM_PREFIX && key.startsWith(NEXT_QUERY_PARAM_PREFIX)) {
            const normalizedKey = key.substring(NEXT_QUERY_PARAM_PREFIX.length);
            requestUrl.searchParams.delete(normalizedKey);
            for (const val of value){
                requestUrl.searchParams.append(normalizedKey, val);
            }
            requestUrl.searchParams.delete(key);
        }
    }
    // Ensure users only see page requests, never data requests.
    const buildId = requestUrl.buildId;
    requestUrl.buildId = "";
    const isDataReq = params.request.headers["x-nextjs-data"];
    if (isDataReq && requestUrl.pathname === "/index") {
        requestUrl.pathname = "/";
    }
    const requestHeaders = fromNodeOutgoingHttpHeaders(params.request.headers);
    const flightHeaders = new Map();
    // Parameters should only be stripped for middleware
    if (!isEdgeRendering) {
        for (const param of adapter_FLIGHT_PARAMETERS){
            const key = param.toString().toLowerCase();
            const value = requestHeaders.get(key);
            if (value) {
                flightHeaders.set(key, requestHeaders.get(key));
                requestHeaders.delete(key);
            }
        }
    }
    const normalizeUrl =  false ? 0 : requestUrl;
    const request = new NextRequestHint({
        page: params.page,
        // Strip internal query parameters off the request.
        input: stripInternalSearchParams(normalizeUrl, true).toString(),
        init: {
            body: params.request.body,
            geo: params.request.geo,
            headers: requestHeaders,
            ip: params.request.ip,
            method: params.request.method,
            nextConfig: params.request.nextConfig,
            signal: params.request.signal
        }
    });
    /**
   * This allows to identify the request as a data request. The user doesn't
   * need to know about this property neither use it. We add it for testing
   * purposes.
   */ if (isDataReq) {
        Object.defineProperty(request, "__isData", {
            enumerable: false,
            value: true
        });
    }
    if (!globalThis.__incrementalCache && params.IncrementalCache) {
        globalThis.__incrementalCache = new params.IncrementalCache({
            appDir: true,
            fetchCache: true,
            minimalMode: "production" !== "development",
            fetchCacheKeyPrefix: undefined,
            dev: "production" === "development",
            requestHeaders: params.request.headers,
            requestProtocol: "https",
            getPrerenderManifest: ()=>{
                return {
                    version: -1,
                    routes: {},
                    dynamicRoutes: {},
                    notFoundRoutes: [],
                    preview: {
                        previewModeId: "development-id"
                    }
                };
            }
        });
    }
    const event = new NextFetchEvent({
        request,
        page: params.page
    });
    let response;
    let cookiesFromResponse;
    // we only care to make async storage available for middleware
    const isMiddleware = params.page === "/middleware" || params.page === "/src/middleware";
    if (isMiddleware) {
        response = await RequestAsyncStorageWrapper.wrap(requestAsyncStorage, {
            req: request,
            renderOpts: {
                onUpdateCookies: (cookies)=>{
                    cookiesFromResponse = cookies;
                },
                // @ts-expect-error: TODO: investigate why previewProps isn't on RenderOpts
                previewProps: (prerenderManifest == null ? void 0 : prerenderManifest.preview) || {
                    previewModeId: "development-id",
                    previewModeEncryptionKey: "",
                    previewModeSigningKey: ""
                }
            }
        }, ()=>params.handler(request, event));
    } else {
        response = await params.handler(request, event);
    }
    // check if response is a Response object
    if (response && !(response instanceof Response)) {
        throw new TypeError("Expected an instance of Response to be returned");
    }
    if (response && cookiesFromResponse) {
        response.headers.set("set-cookie", cookiesFromResponse);
    }
    /**
   * For rewrites we must always include the locale in the final pathname
   * so we re-create the NextURL forcing it to include it when the it is
   * an internal rewrite. Also we make sure the outgoing rewrite URL is
   * a data URL if the request was a data request.
   */ const rewrite = response == null ? void 0 : response.headers.get("x-middleware-rewrite");
    if (response && rewrite) {
        const rewriteUrl = new NextURL(rewrite, {
            forceLocale: true,
            headers: params.request.headers,
            nextConfig: params.request.nextConfig
        });
        if (true) {
            if (rewriteUrl.host === request.nextUrl.host) {
                rewriteUrl.buildId = buildId || rewriteUrl.buildId;
                response.headers.set("x-middleware-rewrite", String(rewriteUrl));
            }
        }
        /**
     * When the request is a data request we must show if there was a rewrite
     * with an internal header so the client knows which component to load
     * from the data request.
     */ const relativizedRewrite = relativizeURL(String(rewriteUrl), String(requestUrl));
        if (isDataReq && // if the rewrite is external and external rewrite
        // resolving config is enabled don't add this header
        // so the upstream app can set it instead
        !(undefined && 0)) {
            response.headers.set("x-nextjs-rewrite", relativizedRewrite);
        }
    }
    /**
   * For redirects we will not include the locale in case when it is the
   * default and we must also make sure the outgoing URL is a data one if
   * the incoming request was a data request.
   */ const redirect = response == null ? void 0 : response.headers.get("Location");
    if (response && redirect && !isEdgeRendering) {
        const redirectURL = new NextURL(redirect, {
            forceLocale: false,
            headers: params.request.headers,
            nextConfig: params.request.nextConfig
        });
        /**
     * Responses created from redirects have immutable headers so we have
     * to clone the response to be able to modify it.
     */ response = new Response(response.body, response);
        if (true) {
            if (redirectURL.host === request.nextUrl.host) {
                redirectURL.buildId = buildId || redirectURL.buildId;
                response.headers.set("Location", String(redirectURL));
            }
        }
        /**
     * When the request is a data request we can't use the location header as
     * it may end up with CORS error. Instead we map to an internal header so
     * the client knows the destination.
     */ if (isDataReq) {
            response.headers.delete("Location");
            response.headers.set("x-nextjs-redirect", relativizeURL(String(redirectURL), String(requestUrl)));
        }
    }
    const finalResponse = response ? response : NextResponse.next();
    // Flight headers are not overridable / removable so they are applied at the end.
    const middlewareOverrideHeaders = finalResponse.headers.get("x-middleware-override-headers");
    const overwrittenHeaders = [];
    if (middlewareOverrideHeaders) {
        for (const [key, value] of flightHeaders){
            finalResponse.headers.set(`x-middleware-request-${key}`, value);
            overwrittenHeaders.push(key);
        }
        if (overwrittenHeaders.length > 0) {
            finalResponse.headers.set("x-middleware-override-headers", middlewareOverrideHeaders + "," + overwrittenHeaders.join(","));
        }
    }
    return {
        response: finalResponse,
        waitUntil: Promise.all(event[waitUntilSymbol])
    };
} //# sourceMappingURL=adapter.js.map

;// CONCATENATED MODULE: ./node_modules/next/dist/esm/server/web/exports/next-response.js
// This file is for modularized imports for next/server to get fully-treeshaking.
 //# sourceMappingURL=next-response.js.map

;// CONCATENATED MODULE: ./node_modules/jose/dist/webapi/lib/buffer_utils.js
const buffer_utils_encoder = new TextEncoder();
const decoder = new TextDecoder();
const MAX_INT32 = (/* unused pure expression or super */ null && (2 ** 32));
function concat(...buffers) {
    const size = buffers.reduce((acc, { length })=>acc + length, 0);
    const buf = new Uint8Array(size);
    let i = 0;
    for (const buffer of buffers){
        buf.set(buffer, i);
        i += buffer.length;
    }
    return buf;
}
function writeUInt32BE(buf, value, offset) {
    if (value < 0 || value >= MAX_INT32) {
        throw new RangeError(`value must be >= 0 and <= ${MAX_INT32 - 1}. Received ${value}`);
    }
    buf.set([
        value >>> 24,
        value >>> 16,
        value >>> 8,
        value & 0xff
    ], offset);
}
function uint64be(value) {
    const high = Math.floor(value / MAX_INT32);
    const low = value % MAX_INT32;
    const buf = new Uint8Array(8);
    writeUInt32BE(buf, high, 0);
    writeUInt32BE(buf, low, 4);
    return buf;
}
function uint32be(value) {
    const buf = new Uint8Array(4);
    writeUInt32BE(buf, value);
    return buf;
}

;// CONCATENATED MODULE: ./node_modules/jose/dist/webapi/lib/base64.js
function base64_encodeBase64(input) {
    if (Uint8Array.prototype.toBase64) {
        return input.toBase64();
    }
    const CHUNK_SIZE = 0x8000;
    const arr = [];
    for(let i = 0; i < input.length; i += CHUNK_SIZE){
        arr.push(String.fromCharCode.apply(null, input.subarray(i, i + CHUNK_SIZE)));
    }
    return btoa(arr.join(""));
}
function decodeBase64(encoded) {
    if (Uint8Array.fromBase64) {
        return Uint8Array.fromBase64(encoded);
    }
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for(let i = 0; i < binary.length; i++){
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

;// CONCATENATED MODULE: ./node_modules/jose/dist/webapi/util/base64url.js


function decode(input) {
    if (Uint8Array.fromBase64) {
        return Uint8Array.fromBase64(typeof input === "string" ? input : decoder.decode(input), {
            alphabet: "base64url"
        });
    }
    let encoded = input;
    if (encoded instanceof Uint8Array) {
        encoded = decoder.decode(encoded);
    }
    encoded = encoded.replace(/-/g, "+").replace(/_/g, "/").replace(/\s/g, "");
    try {
        return decodeBase64(encoded);
    } catch  {
        throw new TypeError("The input to be decoded is not correctly encoded.");
    }
}
function encode(input) {
    let unencoded = input;
    if (typeof unencoded === "string") {
        unencoded = encoder.encode(unencoded);
    }
    if (Uint8Array.prototype.toBase64) {
        return unencoded.toBase64({
            alphabet: "base64url",
            omitPadding: true
        });
    }
    return encodeBase64(unencoded).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

;// CONCATENATED MODULE: ./node_modules/jose/dist/webapi/util/errors.js
class JOSEError extends Error {
    static{
        this.code = "ERR_JOSE_GENERIC";
    }
    constructor(message, options){
        super(message, options);
        this.code = "ERR_JOSE_GENERIC";
        this.name = this.constructor.name;
        Error.captureStackTrace?.(this, this.constructor);
    }
}
class JWTClaimValidationFailed extends JOSEError {
    static{
        this.code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
    }
    constructor(message, payload, claim = "unspecified", reason = "unspecified"){
        super(message, {
            cause: {
                claim,
                reason,
                payload
            }
        });
        this.code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
        this.claim = claim;
        this.reason = reason;
        this.payload = payload;
    }
}
class JWTExpired extends JOSEError {
    static{
        this.code = "ERR_JWT_EXPIRED";
    }
    constructor(message, payload, claim = "unspecified", reason = "unspecified"){
        super(message, {
            cause: {
                claim,
                reason,
                payload
            }
        });
        this.code = "ERR_JWT_EXPIRED";
        this.claim = claim;
        this.reason = reason;
        this.payload = payload;
    }
}
class JOSEAlgNotAllowed extends JOSEError {
    static{
        this.code = "ERR_JOSE_ALG_NOT_ALLOWED";
    }
    constructor(...args){
        super(...args);
        this.code = "ERR_JOSE_ALG_NOT_ALLOWED";
    }
}
class JOSENotSupported extends JOSEError {
    static{
        this.code = "ERR_JOSE_NOT_SUPPORTED";
    }
    constructor(...args){
        super(...args);
        this.code = "ERR_JOSE_NOT_SUPPORTED";
    }
}
class JWEDecryptionFailed extends JOSEError {
    static{
        this.code = "ERR_JWE_DECRYPTION_FAILED";
    }
    constructor(message = "decryption operation failed", options){
        super(message, options);
        this.code = "ERR_JWE_DECRYPTION_FAILED";
    }
}
class JWEInvalid extends JOSEError {
    static{
        this.code = "ERR_JWE_INVALID";
    }
    constructor(...args){
        super(...args);
        this.code = "ERR_JWE_INVALID";
    }
}
class JWSInvalid extends JOSEError {
    static{
        this.code = "ERR_JWS_INVALID";
    }
    constructor(...args){
        super(...args);
        this.code = "ERR_JWS_INVALID";
    }
}
class JWTInvalid extends JOSEError {
    static{
        this.code = "ERR_JWT_INVALID";
    }
    constructor(...args){
        super(...args);
        this.code = "ERR_JWT_INVALID";
    }
}
class JWKInvalid extends JOSEError {
    static{
        this.code = "ERR_JWK_INVALID";
    }
    constructor(...args){
        super(...args);
        this.code = "ERR_JWK_INVALID";
    }
}
class JWKSInvalid extends JOSEError {
    static{
        this.code = "ERR_JWKS_INVALID";
    }
    constructor(...args){
        super(...args);
        this.code = "ERR_JWKS_INVALID";
    }
}
class JWKSNoMatchingKey extends JOSEError {
    static{
        this.code = "ERR_JWKS_NO_MATCHING_KEY";
    }
    constructor(message = "no applicable key found in the JSON Web Key Set", options){
        super(message, options);
        this.code = "ERR_JWKS_NO_MATCHING_KEY";
    }
}
let prop;
class JWKSMultipleMatchingKeys extends JOSEError {
    static{
        prop = Symbol.asyncIterator;
    }
    static{
        this.code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS";
    }
    constructor(message = "multiple matching keys found in the JSON Web Key Set", options){
        super(message, options);
        this.code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS";
    }
}
class JWKSTimeout extends JOSEError {
    static{
        this.code = "ERR_JWKS_TIMEOUT";
    }
    constructor(message = "request timed out", options){
        super(message, options);
        this.code = "ERR_JWKS_TIMEOUT";
    }
}
class JWSSignatureVerificationFailed extends JOSEError {
    static{
        this.code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
    }
    constructor(message = "signature verification failed", options){
        super(message, options);
        this.code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
    }
}

;// CONCATENATED MODULE: ./node_modules/jose/dist/webapi/lib/subtle_dsa.js

/* harmony default export */ const subtle_dsa = ((alg, algorithm)=>{
    const hash = `SHA-${alg.slice(-3)}`;
    switch(alg){
        case "HS256":
        case "HS384":
        case "HS512":
            return {
                hash,
                name: "HMAC"
            };
        case "PS256":
        case "PS384":
        case "PS512":
            return {
                hash,
                name: "RSA-PSS",
                saltLength: parseInt(alg.slice(-3), 10) >> 3
            };
        case "RS256":
        case "RS384":
        case "RS512":
            return {
                hash,
                name: "RSASSA-PKCS1-v1_5"
            };
        case "ES256":
        case "ES384":
        case "ES512":
            return {
                hash,
                name: "ECDSA",
                namedCurve: algorithm.namedCurve
            };
        case "Ed25519":
        case "EdDSA":
            return {
                name: "Ed25519"
            };
        default:
            throw new JOSENotSupported(`alg ${alg} is not supported either by JOSE or your javascript runtime`);
    }
});

;// CONCATENATED MODULE: ./node_modules/jose/dist/webapi/lib/check_key_length.js
/* harmony default export */ const check_key_length = ((alg, key)=>{
    if (alg.startsWith("RS") || alg.startsWith("PS")) {
        const { modulusLength } = key.algorithm;
        if (typeof modulusLength !== "number" || modulusLength < 2048) {
            throw new TypeError(`${alg} requires key modulusLength to be 2048 bits or larger`);
        }
    }
});

;// CONCATENATED MODULE: ./node_modules/jose/dist/webapi/lib/crypto_key.js
function unusable(name, prop = "algorithm.name") {
    return new TypeError(`CryptoKey does not support this operation, its ${prop} must be ${name}`);
}
function isAlgorithm(algorithm, name) {
    return algorithm.name === name;
}
function getHashLength(hash) {
    return parseInt(hash.name.slice(4), 10);
}
function getNamedCurve(alg) {
    switch(alg){
        case "ES256":
            return "P-256";
        case "ES384":
            return "P-384";
        case "ES512":
            return "P-521";
        default:
            throw new Error("unreachable");
    }
}
function checkUsage(key, usage) {
    if (usage && !key.usages.includes(usage)) {
        throw new TypeError(`CryptoKey does not support this operation, its usages must include ${usage}.`);
    }
}
function checkSigCryptoKey(key, alg, usage) {
    switch(alg){
        case "HS256":
        case "HS384":
        case "HS512":
            {
                if (!isAlgorithm(key.algorithm, "HMAC")) throw unusable("HMAC");
                const expected = parseInt(alg.slice(2), 10);
                const actual = getHashLength(key.algorithm.hash);
                if (actual !== expected) throw unusable(`SHA-${expected}`, "algorithm.hash");
                break;
            }
        case "RS256":
        case "RS384":
        case "RS512":
            {
                if (!isAlgorithm(key.algorithm, "RSASSA-PKCS1-v1_5")) throw unusable("RSASSA-PKCS1-v1_5");
                const expected = parseInt(alg.slice(2), 10);
                const actual = getHashLength(key.algorithm.hash);
                if (actual !== expected) throw unusable(`SHA-${expected}`, "algorithm.hash");
                break;
            }
        case "PS256":
        case "PS384":
        case "PS512":
            {
                if (!isAlgorithm(key.algorithm, "RSA-PSS")) throw unusable("RSA-PSS");
                const expected = parseInt(alg.slice(2), 10);
                const actual = getHashLength(key.algorithm.hash);
                if (actual !== expected) throw unusable(`SHA-${expected}`, "algorithm.hash");
                break;
            }
        case "Ed25519":
        case "EdDSA":
            {
                if (!isAlgorithm(key.algorithm, "Ed25519")) throw unusable("Ed25519");
                break;
            }
        case "ES256":
        case "ES384":
        case "ES512":
            {
                if (!isAlgorithm(key.algorithm, "ECDSA")) throw unusable("ECDSA");
                const expected = getNamedCurve(alg);
                const actual = key.algorithm.namedCurve;
                if (actual !== expected) throw unusable(expected, "algorithm.namedCurve");
                break;
            }
        default:
            throw new TypeError("CryptoKey does not support this operation");
    }
    checkUsage(key, usage);
}
function checkEncCryptoKey(key, alg, usage) {
    switch(alg){
        case "A128GCM":
        case "A192GCM":
        case "A256GCM":
            {
                if (!isAlgorithm(key.algorithm, "AES-GCM")) throw unusable("AES-GCM");
                const expected = parseInt(alg.slice(1, 4), 10);
                const actual = key.algorithm.length;
                if (actual !== expected) throw unusable(expected, "algorithm.length");
                break;
            }
        case "A128KW":
        case "A192KW":
        case "A256KW":
            {
                if (!isAlgorithm(key.algorithm, "AES-KW")) throw unusable("AES-KW");
                const expected = parseInt(alg.slice(1, 4), 10);
                const actual = key.algorithm.length;
                if (actual !== expected) throw unusable(expected, "algorithm.length");
                break;
            }
        case "ECDH":
            {
                switch(key.algorithm.name){
                    case "ECDH":
                    case "X25519":
                        break;
                    default:
                        throw unusable("ECDH or X25519");
                }
                break;
            }
        case "PBES2-HS256+A128KW":
        case "PBES2-HS384+A192KW":
        case "PBES2-HS512+A256KW":
            if (!isAlgorithm(key.algorithm, "PBKDF2")) throw unusable("PBKDF2");
            break;
        case "RSA-OAEP":
        case "RSA-OAEP-256":
        case "RSA-OAEP-384":
        case "RSA-OAEP-512":
            {
                if (!isAlgorithm(key.algorithm, "RSA-OAEP")) throw unusable("RSA-OAEP");
                const expected = parseInt(alg.slice(9), 10) || 1;
                const actual = getHashLength(key.algorithm.hash);
                if (actual !== expected) throw unusable(`SHA-${expected}`, "algorithm.hash");
                break;
            }
        default:
            throw new TypeError("CryptoKey does not support this operation");
    }
    checkUsage(key, usage);
}

;// CONCATENATED MODULE: ./node_modules/jose/dist/webapi/lib/invalid_key_input.js
function message(msg, actual, ...types) {
    types = types.filter(Boolean);
    if (types.length > 2) {
        const last = types.pop();
        msg += `one of type ${types.join(", ")}, or ${last}.`;
    } else if (types.length === 2) {
        msg += `one of type ${types[0]} or ${types[1]}.`;
    } else {
        msg += `of type ${types[0]}.`;
    }
    if (actual == null) {
        msg += ` Received ${actual}`;
    } else if (typeof actual === "function" && actual.name) {
        msg += ` Received function ${actual.name}`;
    } else if (typeof actual === "object" && actual != null) {
        if (actual.constructor?.name) {
            msg += ` Received an instance of ${actual.constructor.name}`;
        }
    }
    return msg;
}
/* harmony default export */ const invalid_key_input = ((actual, ...types)=>{
    return message("Key must be ", actual, ...types);
});
function withAlg(alg, actual, ...types) {
    return message(`Key for the ${alg} algorithm must be `, actual, ...types);
}

;// CONCATENATED MODULE: ./node_modules/jose/dist/webapi/lib/get_sign_verify_key.js


/* harmony default export */ const get_sign_verify_key = (async (alg, key, usage)=>{
    if (key instanceof Uint8Array) {
        if (!alg.startsWith("HS")) {
            throw new TypeError(invalid_key_input(key, "CryptoKey", "KeyObject", "JSON Web Key"));
        }
        return crypto.subtle.importKey("raw", key, {
            hash: `SHA-${alg.slice(-3)}`,
            name: "HMAC"
        }, false, [
            usage
        ]);
    }
    checkSigCryptoKey(key, alg, usage);
    return key;
});

;// CONCATENATED MODULE: ./node_modules/jose/dist/webapi/lib/verify.js



/* harmony default export */ const verify = (async (alg, key, signature, data)=>{
    const cryptoKey = await get_sign_verify_key(alg, key, "verify");
    check_key_length(alg, cryptoKey);
    const algorithm = subtle_dsa(alg, cryptoKey.algorithm);
    try {
        return await crypto.subtle.verify(algorithm, cryptoKey, signature, data);
    } catch  {
        return false;
    }
});

;// CONCATENATED MODULE: ./node_modules/jose/dist/webapi/lib/is_disjoint.js
/* harmony default export */ const is_disjoint = ((...headers)=>{
    const sources = headers.filter(Boolean);
    if (sources.length === 0 || sources.length === 1) {
        return true;
    }
    let acc;
    for (const header of sources){
        const parameters = Object.keys(header);
        if (!acc || acc.size === 0) {
            acc = new Set(parameters);
            continue;
        }
        for (const parameter of parameters){
            if (acc.has(parameter)) {
                return false;
            }
            acc.add(parameter);
        }
    }
    return true;
});

;// CONCATENATED MODULE: ./node_modules/jose/dist/webapi/lib/is_object.js
function isObjectLike(value) {
    return typeof value === "object" && value !== null;
}
/* harmony default export */ const is_object = ((input)=>{
    if (!isObjectLike(input) || Object.prototype.toString.call(input) !== "[object Object]") {
        return false;
    }
    if (Object.getPrototypeOf(input) === null) {
        return true;
    }
    let proto = input;
    while(Object.getPrototypeOf(proto) !== null){
        proto = Object.getPrototypeOf(proto);
    }
    return Object.getPrototypeOf(input) === proto;
});

;// CONCATENATED MODULE: ./node_modules/jose/dist/webapi/lib/is_key_like.js
function assertCryptoKey(key) {
    if (!isCryptoKey(key)) {
        throw new Error("CryptoKey instance expected");
    }
}
function isCryptoKey(key) {
    return key?.[Symbol.toStringTag] === "CryptoKey";
}
function isKeyObject(key) {
    return key?.[Symbol.toStringTag] === "KeyObject";
}
/* harmony default export */ const is_key_like = ((key)=>{
    return isCryptoKey(key) || isKeyObject(key);
});

;// CONCATENATED MODULE: ./node_modules/jose/dist/webapi/lib/is_jwk.js

function isJWK(key) {
    return is_object(key) && typeof key.kty === "string";
}
function isPrivateJWK(key) {
    return key.kty !== "oct" && typeof key.d === "string";
}
function isPublicJWK(key) {
    return key.kty !== "oct" && typeof key.d === "undefined";
}
function isSecretJWK(key) {
    return key.kty === "oct" && typeof key.k === "string";
}

;// CONCATENATED MODULE: ./node_modules/jose/dist/webapi/lib/check_key_type.js



const tag = (key)=>key?.[Symbol.toStringTag];
const jwkMatchesOp = (alg, key, usage)=>{
    if (key.use !== undefined) {
        let expected;
        switch(usage){
            case "sign":
            case "verify":
                expected = "sig";
                break;
            case "encrypt":
            case "decrypt":
                expected = "enc";
                break;
        }
        if (key.use !== expected) {
            throw new TypeError(`Invalid key for this operation, its "use" must be "${expected}" when present`);
        }
    }
    if (key.alg !== undefined && key.alg !== alg) {
        throw new TypeError(`Invalid key for this operation, its "alg" must be "${alg}" when present`);
    }
    if (Array.isArray(key.key_ops)) {
        let expectedKeyOp;
        switch(true){
            case usage === "sign" || usage === "verify":
            case alg === "dir":
            case alg.includes("CBC-HS"):
                expectedKeyOp = usage;
                break;
            case alg.startsWith("PBES2"):
                expectedKeyOp = "deriveBits";
                break;
            case /^A\d{3}(?:GCM)?(?:KW)?$/.test(alg):
                if (!alg.includes("GCM") && alg.endsWith("KW")) {
                    expectedKeyOp = usage === "encrypt" ? "wrapKey" : "unwrapKey";
                } else {
                    expectedKeyOp = usage;
                }
                break;
            case usage === "encrypt" && alg.startsWith("RSA"):
                expectedKeyOp = "wrapKey";
                break;
            case usage === "decrypt":
                expectedKeyOp = alg.startsWith("RSA") ? "unwrapKey" : "deriveBits";
                break;
        }
        if (expectedKeyOp && key.key_ops?.includes?.(expectedKeyOp) === false) {
            throw new TypeError(`Invalid key for this operation, its "key_ops" must include "${expectedKeyOp}" when present`);
        }
    }
    return true;
};
const symmetricTypeCheck = (alg, key, usage)=>{
    if (key instanceof Uint8Array) return;
    if (isJWK(key)) {
        if (isSecretJWK(key) && jwkMatchesOp(alg, key, usage)) return;
        throw new TypeError(`JSON Web Key for symmetric algorithms must have JWK "kty" (Key Type) equal to "oct" and the JWK "k" (Key Value) present`);
    }
    if (!is_key_like(key)) {
        throw new TypeError(withAlg(alg, key, "CryptoKey", "KeyObject", "JSON Web Key", "Uint8Array"));
    }
    if (key.type !== "secret") {
        throw new TypeError(`${tag(key)} instances for symmetric algorithms must be of type "secret"`);
    }
};
const asymmetricTypeCheck = (alg, key, usage)=>{
    if (isJWK(key)) {
        switch(usage){
            case "decrypt":
            case "sign":
                if (isPrivateJWK(key) && jwkMatchesOp(alg, key, usage)) return;
                throw new TypeError(`JSON Web Key for this operation be a private JWK`);
            case "encrypt":
            case "verify":
                if (isPublicJWK(key) && jwkMatchesOp(alg, key, usage)) return;
                throw new TypeError(`JSON Web Key for this operation be a public JWK`);
        }
    }
    if (!is_key_like(key)) {
        throw new TypeError(withAlg(alg, key, "CryptoKey", "KeyObject", "JSON Web Key"));
    }
    if (key.type === "secret") {
        throw new TypeError(`${tag(key)} instances for asymmetric algorithms must not be of type "secret"`);
    }
    if (key.type === "public") {
        switch(usage){
            case "sign":
                throw new TypeError(`${tag(key)} instances for asymmetric algorithm signing must be of type "private"`);
            case "decrypt":
                throw new TypeError(`${tag(key)} instances for asymmetric algorithm decryption must be of type "private"`);
            default:
                break;
        }
    }
    if (key.type === "private") {
        switch(usage){
            case "verify":
                throw new TypeError(`${tag(key)} instances for asymmetric algorithm verifying must be of type "public"`);
            case "encrypt":
                throw new TypeError(`${tag(key)} instances for asymmetric algorithm encryption must be of type "public"`);
            default:
                break;
        }
    }
};
/* harmony default export */ const check_key_type = ((alg, key, usage)=>{
    const symmetric = alg.startsWith("HS") || alg === "dir" || alg.startsWith("PBES2") || /^A(?:128|192|256)(?:GCM)?(?:KW)?$/.test(alg) || /^A(?:128|192|256)CBC-HS(?:256|384|512)$/.test(alg);
    if (symmetric) {
        symmetricTypeCheck(alg, key, usage);
    } else {
        asymmetricTypeCheck(alg, key, usage);
    }
});

;// CONCATENATED MODULE: ./node_modules/jose/dist/webapi/lib/validate_crit.js

/* harmony default export */ const validate_crit = ((Err, recognizedDefault, recognizedOption, protectedHeader, joseHeader)=>{
    if (joseHeader.crit !== undefined && protectedHeader?.crit === undefined) {
        throw new Err('"crit" (Critical) Header Parameter MUST be integrity protected');
    }
    if (!protectedHeader || protectedHeader.crit === undefined) {
        return new Set();
    }
    if (!Array.isArray(protectedHeader.crit) || protectedHeader.crit.length === 0 || protectedHeader.crit.some((input)=>typeof input !== "string" || input.length === 0)) {
        throw new Err('"crit" (Critical) Header Parameter MUST be an array of non-empty strings when present');
    }
    let recognized;
    if (recognizedOption !== undefined) {
        recognized = new Map([
            ...Object.entries(recognizedOption),
            ...recognizedDefault.entries()
        ]);
    } else {
        recognized = recognizedDefault;
    }
    for (const parameter of protectedHeader.crit){
        if (!recognized.has(parameter)) {
            throw new JOSENotSupported(`Extension Header Parameter "${parameter}" is not recognized`);
        }
        if (joseHeader[parameter] === undefined) {
            throw new Err(`Extension Header Parameter "${parameter}" is missing`);
        }
        if (recognized.get(parameter) && protectedHeader[parameter] === undefined) {
            throw new Err(`Extension Header Parameter "${parameter}" MUST be integrity protected`);
        }
    }
    return new Set(protectedHeader.crit);
});

;// CONCATENATED MODULE: ./node_modules/jose/dist/webapi/lib/validate_algorithms.js
/* harmony default export */ const validate_algorithms = ((option, algorithms)=>{
    if (algorithms !== undefined && (!Array.isArray(algorithms) || algorithms.some((s)=>typeof s !== "string"))) {
        throw new TypeError(`"${option}" option must be an array of strings`);
    }
    if (!algorithms) {
        return undefined;
    }
    return new Set(algorithms);
});

;// CONCATENATED MODULE: ./node_modules/jose/dist/webapi/lib/jwk_to_key.js

function subtleMapping(jwk) {
    let algorithm;
    let keyUsages;
    switch(jwk.kty){
        case "RSA":
            {
                switch(jwk.alg){
                    case "PS256":
                    case "PS384":
                    case "PS512":
                        algorithm = {
                            name: "RSA-PSS",
                            hash: `SHA-${jwk.alg.slice(-3)}`
                        };
                        keyUsages = jwk.d ? [
                            "sign"
                        ] : [
                            "verify"
                        ];
                        break;
                    case "RS256":
                    case "RS384":
                    case "RS512":
                        algorithm = {
                            name: "RSASSA-PKCS1-v1_5",
                            hash: `SHA-${jwk.alg.slice(-3)}`
                        };
                        keyUsages = jwk.d ? [
                            "sign"
                        ] : [
                            "verify"
                        ];
                        break;
                    case "RSA-OAEP":
                    case "RSA-OAEP-256":
                    case "RSA-OAEP-384":
                    case "RSA-OAEP-512":
                        algorithm = {
                            name: "RSA-OAEP",
                            hash: `SHA-${parseInt(jwk.alg.slice(-3), 10) || 1}`
                        };
                        keyUsages = jwk.d ? [
                            "decrypt",
                            "unwrapKey"
                        ] : [
                            "encrypt",
                            "wrapKey"
                        ];
                        break;
                    default:
                        throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
                }
                break;
            }
        case "EC":
            {
                switch(jwk.alg){
                    case "ES256":
                        algorithm = {
                            name: "ECDSA",
                            namedCurve: "P-256"
                        };
                        keyUsages = jwk.d ? [
                            "sign"
                        ] : [
                            "verify"
                        ];
                        break;
                    case "ES384":
                        algorithm = {
                            name: "ECDSA",
                            namedCurve: "P-384"
                        };
                        keyUsages = jwk.d ? [
                            "sign"
                        ] : [
                            "verify"
                        ];
                        break;
                    case "ES512":
                        algorithm = {
                            name: "ECDSA",
                            namedCurve: "P-521"
                        };
                        keyUsages = jwk.d ? [
                            "sign"
                        ] : [
                            "verify"
                        ];
                        break;
                    case "ECDH-ES":
                    case "ECDH-ES+A128KW":
                    case "ECDH-ES+A192KW":
                    case "ECDH-ES+A256KW":
                        algorithm = {
                            name: "ECDH",
                            namedCurve: jwk.crv
                        };
                        keyUsages = jwk.d ? [
                            "deriveBits"
                        ] : [];
                        break;
                    default:
                        throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
                }
                break;
            }
        case "OKP":
            {
                switch(jwk.alg){
                    case "Ed25519":
                    case "EdDSA":
                        algorithm = {
                            name: "Ed25519"
                        };
                        keyUsages = jwk.d ? [
                            "sign"
                        ] : [
                            "verify"
                        ];
                        break;
                    case "ECDH-ES":
                    case "ECDH-ES+A128KW":
                    case "ECDH-ES+A192KW":
                    case "ECDH-ES+A256KW":
                        algorithm = {
                            name: jwk.crv
                        };
                        keyUsages = jwk.d ? [
                            "deriveBits"
                        ] : [];
                        break;
                    default:
                        throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
                }
                break;
            }
        default:
            throw new JOSENotSupported('Invalid or unsupported JWK "kty" (Key Type) Parameter value');
    }
    return {
        algorithm,
        keyUsages
    };
}
/* harmony default export */ const jwk_to_key = (async (jwk)=>{
    if (!jwk.alg) {
        throw new TypeError('"alg" argument is required when "jwk.alg" is not present');
    }
    const { algorithm, keyUsages } = subtleMapping(jwk);
    const keyData = {
        ...jwk
    };
    delete keyData.alg;
    delete keyData.use;
    return crypto.subtle.importKey("jwk", keyData, algorithm, jwk.ext ?? (jwk.d ? false : true), jwk.key_ops ?? keyUsages);
});

;// CONCATENATED MODULE: ./node_modules/jose/dist/webapi/lib/normalize_key.js




let cache;
const handleJWK = async (key, jwk, alg, freeze = false)=>{
    cache ||= new WeakMap();
    let cached = cache.get(key);
    if (cached?.[alg]) {
        return cached[alg];
    }
    const cryptoKey = await jwk_to_key({
        ...jwk,
        alg
    });
    if (freeze) Object.freeze(key);
    if (!cached) {
        cache.set(key, {
            [alg]: cryptoKey
        });
    } else {
        cached[alg] = cryptoKey;
    }
    return cryptoKey;
};
const handleKeyObject = (keyObject, alg)=>{
    cache ||= new WeakMap();
    let cached = cache.get(keyObject);
    if (cached?.[alg]) {
        return cached[alg];
    }
    const isPublic = keyObject.type === "public";
    const extractable = isPublic ? true : false;
    let cryptoKey;
    if (keyObject.asymmetricKeyType === "x25519") {
        switch(alg){
            case "ECDH-ES":
            case "ECDH-ES+A128KW":
            case "ECDH-ES+A192KW":
            case "ECDH-ES+A256KW":
                break;
            default:
                throw new TypeError("given KeyObject instance cannot be used for this algorithm");
        }
        cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, isPublic ? [] : [
            "deriveBits"
        ]);
    }
    if (keyObject.asymmetricKeyType === "ed25519") {
        if (alg !== "EdDSA" && alg !== "Ed25519") {
            throw new TypeError("given KeyObject instance cannot be used for this algorithm");
        }
        cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, [
            isPublic ? "verify" : "sign"
        ]);
    }
    if (keyObject.asymmetricKeyType === "rsa") {
        let hash;
        switch(alg){
            case "RSA-OAEP":
                hash = "SHA-1";
                break;
            case "RS256":
            case "PS256":
            case "RSA-OAEP-256":
                hash = "SHA-256";
                break;
            case "RS384":
            case "PS384":
            case "RSA-OAEP-384":
                hash = "SHA-384";
                break;
            case "RS512":
            case "PS512":
            case "RSA-OAEP-512":
                hash = "SHA-512";
                break;
            default:
                throw new TypeError("given KeyObject instance cannot be used for this algorithm");
        }
        if (alg.startsWith("RSA-OAEP")) {
            return keyObject.toCryptoKey({
                name: "RSA-OAEP",
                hash
            }, extractable, isPublic ? [
                "encrypt"
            ] : [
                "decrypt"
            ]);
        }
        cryptoKey = keyObject.toCryptoKey({
            name: alg.startsWith("PS") ? "RSA-PSS" : "RSASSA-PKCS1-v1_5",
            hash
        }, extractable, [
            isPublic ? "verify" : "sign"
        ]);
    }
    if (keyObject.asymmetricKeyType === "ec") {
        const nist = new Map([
            [
                "prime256v1",
                "P-256"
            ],
            [
                "secp384r1",
                "P-384"
            ],
            [
                "secp521r1",
                "P-521"
            ]
        ]);
        const namedCurve = nist.get(keyObject.asymmetricKeyDetails?.namedCurve);
        if (!namedCurve) {
            throw new TypeError("given KeyObject instance cannot be used for this algorithm");
        }
        if (alg === "ES256" && namedCurve === "P-256") {
            cryptoKey = keyObject.toCryptoKey({
                name: "ECDSA",
                namedCurve
            }, extractable, [
                isPublic ? "verify" : "sign"
            ]);
        }
        if (alg === "ES384" && namedCurve === "P-384") {
            cryptoKey = keyObject.toCryptoKey({
                name: "ECDSA",
                namedCurve
            }, extractable, [
                isPublic ? "verify" : "sign"
            ]);
        }
        if (alg === "ES512" && namedCurve === "P-521") {
            cryptoKey = keyObject.toCryptoKey({
                name: "ECDSA",
                namedCurve
            }, extractable, [
                isPublic ? "verify" : "sign"
            ]);
        }
        if (alg.startsWith("ECDH-ES")) {
            cryptoKey = keyObject.toCryptoKey({
                name: "ECDH",
                namedCurve
            }, extractable, isPublic ? [] : [
                "deriveBits"
            ]);
        }
    }
    if (!cryptoKey) {
        throw new TypeError("given KeyObject instance cannot be used for this algorithm");
    }
    if (!cached) {
        cache.set(keyObject, {
            [alg]: cryptoKey
        });
    } else {
        cached[alg] = cryptoKey;
    }
    return cryptoKey;
};
/* harmony default export */ const normalize_key = (async (key, alg)=>{
    if (key instanceof Uint8Array) {
        return key;
    }
    if (isCryptoKey(key)) {
        return key;
    }
    if (isKeyObject(key)) {
        if (key.type === "secret") {
            return key.export();
        }
        if ("toCryptoKey" in key && typeof key.toCryptoKey === "function") {
            try {
                return handleKeyObject(key, alg);
            } catch (err) {
                if (err instanceof TypeError) {
                    throw err;
                }
            }
        }
        let jwk = key.export({
            format: "jwk"
        });
        return handleJWK(key, jwk, alg);
    }
    if (isJWK(key)) {
        if (key.k) {
            return decode(key.k);
        }
        return handleJWK(key, key, alg, true);
    }
    throw new Error("unreachable");
});

;// CONCATENATED MODULE: ./node_modules/jose/dist/webapi/jws/flattened/verify.js










async function flattenedVerify(jws, key, options) {
    if (!is_object(jws)) {
        throw new JWSInvalid("Flattened JWS must be an object");
    }
    if (jws.protected === undefined && jws.header === undefined) {
        throw new JWSInvalid('Flattened JWS must have either of the "protected" or "header" members');
    }
    if (jws.protected !== undefined && typeof jws.protected !== "string") {
        throw new JWSInvalid("JWS Protected Header incorrect type");
    }
    if (jws.payload === undefined) {
        throw new JWSInvalid("JWS Payload missing");
    }
    if (typeof jws.signature !== "string") {
        throw new JWSInvalid("JWS Signature missing or incorrect type");
    }
    if (jws.header !== undefined && !is_object(jws.header)) {
        throw new JWSInvalid("JWS Unprotected Header incorrect type");
    }
    let parsedProt = {};
    if (jws.protected) {
        try {
            const protectedHeader = decode(jws.protected);
            parsedProt = JSON.parse(decoder.decode(protectedHeader));
        } catch  {
            throw new JWSInvalid("JWS Protected Header is invalid");
        }
    }
    if (!is_disjoint(parsedProt, jws.header)) {
        throw new JWSInvalid("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");
    }
    const joseHeader = {
        ...parsedProt,
        ...jws.header
    };
    const extensions = validate_crit(JWSInvalid, new Map([
        [
            "b64",
            true
        ]
    ]), options?.crit, parsedProt, joseHeader);
    let b64 = true;
    if (extensions.has("b64")) {
        b64 = parsedProt.b64;
        if (typeof b64 !== "boolean") {
            throw new JWSInvalid('The "b64" (base64url-encode payload) Header Parameter must be a boolean');
        }
    }
    const { alg } = joseHeader;
    if (typeof alg !== "string" || !alg) {
        throw new JWSInvalid('JWS "alg" (Algorithm) Header Parameter missing or invalid');
    }
    const algorithms = options && validate_algorithms("algorithms", options.algorithms);
    if (algorithms && !algorithms.has(alg)) {
        throw new JOSEAlgNotAllowed('"alg" (Algorithm) Header Parameter value not allowed');
    }
    if (b64) {
        if (typeof jws.payload !== "string") {
            throw new JWSInvalid("JWS Payload must be a string");
        }
    } else if (typeof jws.payload !== "string" && !(jws.payload instanceof Uint8Array)) {
        throw new JWSInvalid("JWS Payload must be a string or an Uint8Array instance");
    }
    let resolvedKey = false;
    if (typeof key === "function") {
        key = await key(parsedProt, jws);
        resolvedKey = true;
    }
    check_key_type(alg, key, "verify");
    const data = concat(buffer_utils_encoder.encode(jws.protected ?? ""), buffer_utils_encoder.encode("."), typeof jws.payload === "string" ? buffer_utils_encoder.encode(jws.payload) : jws.payload);
    let signature;
    try {
        signature = decode(jws.signature);
    } catch  {
        throw new JWSInvalid("Failed to base64url decode the signature");
    }
    const k = await normalize_key(key, alg);
    const verified = await verify(alg, k, signature, data);
    if (!verified) {
        throw new JWSSignatureVerificationFailed();
    }
    let payload;
    if (b64) {
        try {
            payload = decode(jws.payload);
        } catch  {
            throw new JWSInvalid("Failed to base64url decode the payload");
        }
    } else if (typeof jws.payload === "string") {
        payload = buffer_utils_encoder.encode(jws.payload);
    } else {
        payload = jws.payload;
    }
    const result = {
        payload
    };
    if (jws.protected !== undefined) {
        result.protectedHeader = parsedProt;
    }
    if (jws.header !== undefined) {
        result.unprotectedHeader = jws.header;
    }
    if (resolvedKey) {
        return {
            ...result,
            key: k
        };
    }
    return result;
}

;// CONCATENATED MODULE: ./node_modules/jose/dist/webapi/jws/compact/verify.js



async function compactVerify(jws, key, options) {
    if (jws instanceof Uint8Array) {
        jws = decoder.decode(jws);
    }
    if (typeof jws !== "string") {
        throw new JWSInvalid("Compact JWS must be a string or Uint8Array");
    }
    const { 0: protectedHeader, 1: payload, 2: signature, length } = jws.split(".");
    if (length !== 3) {
        throw new JWSInvalid("Invalid Compact JWS");
    }
    const verified = await flattenedVerify({
        payload,
        protected: protectedHeader,
        signature
    }, key, options);
    const result = {
        payload: verified.payload,
        protectedHeader: verified.protectedHeader
    };
    if (typeof key === "function") {
        return {
            ...result,
            key: verified.key
        };
    }
    return result;
}

;// CONCATENATED MODULE: ./node_modules/jose/dist/webapi/lib/epoch.js
/* harmony default export */ const lib_epoch = ((date)=>Math.floor(date.getTime() / 1000));

;// CONCATENATED MODULE: ./node_modules/jose/dist/webapi/lib/secs.js
const minute = 60;
const hour = minute * 60;
const day = hour * 24;
const week = day * 7;
const year = day * 365.25;
const REGEX = /^(\+|\-)? ?(\d+|\d+\.\d+) ?(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)(?: (ago|from now))?$/i;
/* harmony default export */ const lib_secs = ((str)=>{
    const matched = REGEX.exec(str);
    if (!matched || matched[4] && matched[1]) {
        throw new TypeError("Invalid time period format");
    }
    const value = parseFloat(matched[2]);
    const unit = matched[3].toLowerCase();
    let numericDate;
    switch(unit){
        case "sec":
        case "secs":
        case "second":
        case "seconds":
        case "s":
            numericDate = Math.round(value);
            break;
        case "minute":
        case "minutes":
        case "min":
        case "mins":
        case "m":
            numericDate = Math.round(value * minute);
            break;
        case "hour":
        case "hours":
        case "hr":
        case "hrs":
        case "h":
            numericDate = Math.round(value * hour);
            break;
        case "day":
        case "days":
        case "d":
            numericDate = Math.round(value * day);
            break;
        case "week":
        case "weeks":
        case "w":
            numericDate = Math.round(value * week);
            break;
        default:
            numericDate = Math.round(value * year);
            break;
    }
    if (matched[1] === "-" || matched[4] === "ago") {
        return -numericDate;
    }
    return numericDate;
});

;// CONCATENATED MODULE: ./node_modules/jose/dist/webapi/lib/jwt_claims_set.js






function validateInput(label, input) {
    if (!Number.isFinite(input)) {
        throw new TypeError(`Invalid ${label} input`);
    }
    return input;
}
const normalizeTyp = (value)=>{
    if (value.includes("/")) {
        return value.toLowerCase();
    }
    return `application/${value.toLowerCase()}`;
};
const checkAudiencePresence = (audPayload, audOption)=>{
    if (typeof audPayload === "string") {
        return audOption.includes(audPayload);
    }
    if (Array.isArray(audPayload)) {
        return audOption.some(Set.prototype.has.bind(new Set(audPayload)));
    }
    return false;
};
function validateClaimsSet(protectedHeader, encodedPayload, options = {}) {
    let payload;
    try {
        payload = JSON.parse(decoder.decode(encodedPayload));
    } catch  {}
    if (!is_object(payload)) {
        throw new JWTInvalid("JWT Claims Set must be a top-level JSON object");
    }
    const { typ } = options;
    if (typ && (typeof protectedHeader.typ !== "string" || normalizeTyp(protectedHeader.typ) !== normalizeTyp(typ))) {
        throw new JWTClaimValidationFailed('unexpected "typ" JWT header value', payload, "typ", "check_failed");
    }
    const { requiredClaims = [], issuer, subject, audience, maxTokenAge } = options;
    const presenceCheck = [
        ...requiredClaims
    ];
    if (maxTokenAge !== undefined) presenceCheck.push("iat");
    if (audience !== undefined) presenceCheck.push("aud");
    if (subject !== undefined) presenceCheck.push("sub");
    if (issuer !== undefined) presenceCheck.push("iss");
    for (const claim of new Set(presenceCheck.reverse())){
        if (!(claim in payload)) {
            throw new JWTClaimValidationFailed(`missing required "${claim}" claim`, payload, claim, "missing");
        }
    }
    if (issuer && !(Array.isArray(issuer) ? issuer : [
        issuer
    ]).includes(payload.iss)) {
        throw new JWTClaimValidationFailed('unexpected "iss" claim value', payload, "iss", "check_failed");
    }
    if (subject && payload.sub !== subject) {
        throw new JWTClaimValidationFailed('unexpected "sub" claim value', payload, "sub", "check_failed");
    }
    if (audience && !checkAudiencePresence(payload.aud, typeof audience === "string" ? [
        audience
    ] : audience)) {
        throw new JWTClaimValidationFailed('unexpected "aud" claim value', payload, "aud", "check_failed");
    }
    let tolerance;
    switch(typeof options.clockTolerance){
        case "string":
            tolerance = lib_secs(options.clockTolerance);
            break;
        case "number":
            tolerance = options.clockTolerance;
            break;
        case "undefined":
            tolerance = 0;
            break;
        default:
            throw new TypeError("Invalid clockTolerance option type");
    }
    const { currentDate } = options;
    const now = lib_epoch(currentDate || new Date());
    if ((payload.iat !== undefined || maxTokenAge) && typeof payload.iat !== "number") {
        throw new JWTClaimValidationFailed('"iat" claim must be a number', payload, "iat", "invalid");
    }
    if (payload.nbf !== undefined) {
        if (typeof payload.nbf !== "number") {
            throw new JWTClaimValidationFailed('"nbf" claim must be a number', payload, "nbf", "invalid");
        }
        if (payload.nbf > now + tolerance) {
            throw new JWTClaimValidationFailed('"nbf" claim timestamp check failed', payload, "nbf", "check_failed");
        }
    }
    if (payload.exp !== undefined) {
        if (typeof payload.exp !== "number") {
            throw new JWTClaimValidationFailed('"exp" claim must be a number', payload, "exp", "invalid");
        }
        if (payload.exp <= now - tolerance) {
            throw new JWTExpired('"exp" claim timestamp check failed', payload, "exp", "check_failed");
        }
    }
    if (maxTokenAge) {
        const age = now - payload.iat;
        const max = typeof maxTokenAge === "number" ? maxTokenAge : lib_secs(maxTokenAge);
        if (age - tolerance > max) {
            throw new JWTExpired('"iat" claim timestamp check failed (too far in the past)', payload, "iat", "check_failed");
        }
        if (age < 0 - tolerance) {
            throw new JWTClaimValidationFailed('"iat" claim timestamp check failed (it should be in the past)', payload, "iat", "check_failed");
        }
    }
    return payload;
}
class JWTClaimsBuilder {
    #payload;
    constructor(payload){
        if (!isObject(payload)) {
            throw new TypeError("JWT Claims Set MUST be an object");
        }
        this.#payload = structuredClone(payload);
    }
    data() {
        return encoder.encode(JSON.stringify(this.#payload));
    }
    get iss() {
        return this.#payload.iss;
    }
    set iss(value) {
        this.#payload.iss = value;
    }
    get sub() {
        return this.#payload.sub;
    }
    set sub(value) {
        this.#payload.sub = value;
    }
    get aud() {
        return this.#payload.aud;
    }
    set aud(value) {
        this.#payload.aud = value;
    }
    set jti(value) {
        this.#payload.jti = value;
    }
    set nbf(value) {
        if (typeof value === "number") {
            this.#payload.nbf = validateInput("setNotBefore", value);
        } else if (value instanceof Date) {
            this.#payload.nbf = validateInput("setNotBefore", epoch(value));
        } else {
            this.#payload.nbf = epoch(new Date()) + secs(value);
        }
    }
    set exp(value) {
        if (typeof value === "number") {
            this.#payload.exp = validateInput("setExpirationTime", value);
        } else if (value instanceof Date) {
            this.#payload.exp = validateInput("setExpirationTime", epoch(value));
        } else {
            this.#payload.exp = epoch(new Date()) + secs(value);
        }
    }
    set iat(value) {
        if (typeof value === "undefined") {
            this.#payload.iat = epoch(new Date());
        } else if (value instanceof Date) {
            this.#payload.iat = validateInput("setIssuedAt", epoch(value));
        } else if (typeof value === "string") {
            this.#payload.iat = validateInput("setIssuedAt", epoch(new Date()) + secs(value));
        } else {
            this.#payload.iat = validateInput("setIssuedAt", value);
        }
    }
}

;// CONCATENATED MODULE: ./node_modules/jose/dist/webapi/jwt/verify.js



async function jwtVerify(jwt, key, options) {
    const verified = await compactVerify(jwt, key, options);
    if (verified.protectedHeader.crit?.includes("b64") && verified.protectedHeader.b64 === false) {
        throw new JWTInvalid("JWTs MUST NOT use unencoded payload");
    }
    const payload = validateClaimsSet(verified.protectedHeader, verified.payload, options);
    const result = {
        payload,
        protectedHeader: verified.protectedHeader
    };
    if (typeof key === "function") {
        return {
            ...result,
            key: verified.key
        };
    }
    return result;
}

;// CONCATENATED MODULE: ./app/middleware.ts


const JWT_SECRET = process.env.JWT_SECRET || "your_very_secure_secret_key_for_jwt_please_change_this";
const LOGIN_URL = "/login"; // Assuming your login page is at /login
// Helper function to verify token using jose (Edge-runtime compatible)
async function verifyToken(token) {
    try {
        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return payload;
    } catch (error) {
        console.error("JWT Verification Error:", error);
        return null;
    }
}
async function middleware(req) {
    console.log("*** middleware hit for", req.nextUrl.pathname);
    const { pathname } = req.nextUrl;
    // Paths that do not require authentication
    const publicPaths = [
        LOGIN_URL,
        "/api/auth/login",
        "/api/auth/ldap-quick-check"
    ];
    // Skip static asset file requests
    if (/\.(?:js|css|json|map)$/i.test(pathname)) {
        return NextResponse.next();
    }
    if (publicPaths.some((path)=>pathname.startsWith(path))) {
        return NextResponse.next();
    }
    // --- LDAP quick-check: if LDAP is down and user is unauthenticated, always go to manual login
    // Call quick-check API (public) to know LDAP status
    try {
        const checkRes = await fetch(new URL("/api/auth/ldap-quick-check", req.nextUrl));
        if (checkRes.ok) {
            const { ok: ldapOk } = await checkRes.json();
            console.log("LDAP status", ldapOk);
            if (!ldapOk) {
                const authHeaderTmp = req.headers.get("Authorization");
                const tmpTokenHeader = authHeaderTmp?.startsWith("Bearer ") ? authHeaderTmp.substring(7) : null;
                const tmpCookieToken = req.cookies.get("token")?.value;
                if (!tmpTokenHeader && !tmpCookieToken && pathname !== LOGIN_URL && !pathname.startsWith("/api/")) {
                    return NextResponse.redirect(new URL(LOGIN_URL, req.url));
                }
            }
        }
    } catch (e) {
        console.error("Middleware: LDAP quick-check fetch failed", e);
    // fail-open
    }
    // Get token from Authorization header
    let authHeader = req.headers.get("Authorization");
    console.log("Cookie token raw:", req.cookies.get("token")?.value);
    if (!authHeader) {
        const cookieToken = req.cookies.get("token")?.value;
        if (cookieToken) {
            authHeader = `Bearer ${cookieToken}`;
        }
    }
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
    if (!token) {
        console.log(`Middleware: No token found for path ${pathname}. Redirecting to login.`);
        // For API routes, return 401. For page routes, redirect to login.
        if (pathname.startsWith("/api/")) {
            return NextResponse.json({
                message: "Authentication required."
            }, {
                status: 401
            });
        }
        return NextResponse.redirect(new URL(LOGIN_URL, req.url));
    }
    const decodedUser = await verifyToken(token);
    if (!decodedUser) {
        console.log(`Middleware: Invalid token for path ${pathname}. Redirecting to login.`);
        if (pathname.startsWith("/api/")) {
            return NextResponse.json({
                message: "Invalid or expired token."
            }, {
                status: 401
            });
        }
        // Clear potentially invalid token from cookies if stored there (not standard for Bearer but good practice)
        const response = NextResponse.redirect(new URL(LOGIN_URL, req.url));
        // response.cookies.delete('your_token_cookie_name'); // If you were using cookies for token
        return response;
    }
    // Admin role check for admin paths
    const adminApiPaths = [
        "/api/users",
        "/api/config"
    ]; // Add more admin API paths as needed
    const adminPagePaths = [
        "/admin"
    ]; // Add more admin page paths as needed
    const requiresAdmin = adminApiPaths.some((path)=>pathname.startsWith(path)) || adminPagePaths.some((path)=>pathname.startsWith(path));
    const isAdminUser = decodedUser.status === "admin" || decodedUser.role === "admin";
    if (requiresAdmin && !isAdminUser) {
        console.log(`Middleware: User ${decodedUser.email} (role: ${decodedUser.status}) attempted to access admin path ${pathname}.`);
        if (pathname.startsWith("/api/")) {
            return NextResponse.json({
                message: "Forbidden: Administrator access required."
            }, {
                status: 403
            });
        }
        // For admin pages, redirect to a general dashboard or show a forbidden page
        // For simplicity, redirecting to a hypothetical dashboard page
        return NextResponse.redirect(new URL("/", req.url)); // Or new URL('/forbidden', req.url)
    }
    // If token is valid and all checks pass, proceed
    // You can add the decoded user to the request headers if needed by API routes/server components
    // Note: Modifying request headers in middleware is standard practice.
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-user-id", decodedUser.id);
    requestHeaders.set("x-user-email", decodedUser.email);
    requestHeaders.set("x-user-status", decodedUser.status);
    if (decodedUser.role) {
        requestHeaders.set("x-user-role", decodedUser.role);
    }
    requestHeaders.set("x-user-name", decodedUser.name);
    return NextResponse.next({
        request: {
            headers: requestHeaders
        }
    });
}
// Configure which paths the middleware runs on
const config = {
    matcher: [
        // Match all paths except Next.js internals and static assets
        "/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js|css)$).*)"
    ]
};

;// CONCATENATED MODULE: ./middleware.ts


;// CONCATENATED MODULE: ./node_modules/next/dist/build/webpack/loaders/next-middleware-loader.js?absolutePagePath=private-next-root-dir%2Fmiddleware.ts&page=%2Fmiddleware&rootDir=C%3A%5CUsers%5CBobM%5CCascadeProjects%5CTallmanDashboard_new&matchers=&preferredRegion=&middlewareConfig=e30%3D!

        
        
        

        const mod = { ...middleware_namespaceObject_0 }
        const handler = mod.middleware || mod.default

        if (typeof handler !== 'function') {
          throw new Error('The Middleware "pages/middleware" must export a `middleware` or a `default` function');
        }

        /* harmony default export */ function next_middleware_loaderabsolutePagePath_private_next_root_dir_2Fmiddleware_ts_page_2Fmiddleware_rootDir_C_3A_5CUsers_5CBobM_5CCascadeProjects_5CTallmanDashboard_new_matchers_preferredRegion_middlewareConfig_e30_3D_(opts) {
          return adapter({
            ...opts,
            page: "/middleware",
            handler,
          })
        }
    

/***/ }),

/***/ 929:
/***/ ((module) => {

"use strict";

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all)=>{
    for(var name in all)__defProp(target, name, {
        get: all[name],
        enumerable: true
    });
};
var __copyProps = (to, from, except, desc)=>{
    if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames(from))if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
            get: ()=>from[key],
            enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
        });
    }
    return to;
};
var __toCommonJS = (mod)=>__copyProps(__defProp({}, "__esModule", {
        value: true
    }), mod);
// src/index.ts
var src_exports = {};
__export(src_exports, {
    RequestCookies: ()=>RequestCookies,
    ResponseCookies: ()=>ResponseCookies,
    parseCookie: ()=>parseCookie,
    parseSetCookie: ()=>parseSetCookie,
    splitCookiesString: ()=>splitCookiesString,
    stringifyCookie: ()=>stringifyCookie
});
module.exports = __toCommonJS(src_exports);
// src/serialize.ts
function stringifyCookie(c) {
    var _a;
    const attrs = [
        "path" in c && c.path && `Path=${c.path}`,
        "expires" in c && (c.expires || c.expires === 0) && `Expires=${(typeof c.expires === "number" ? new Date(c.expires) : c.expires).toUTCString()}`,
        "maxAge" in c && typeof c.maxAge === "number" && `Max-Age=${c.maxAge}`,
        "domain" in c && c.domain && `Domain=${c.domain}`,
        "secure" in c && c.secure && "Secure",
        "httpOnly" in c && c.httpOnly && "HttpOnly",
        "sameSite" in c && c.sameSite && `SameSite=${c.sameSite}`
    ].filter(Boolean);
    return `${c.name}=${encodeURIComponent((_a = c.value) != null ? _a : "")}; ${attrs.join("; ")}`;
}
function parseCookie(cookie) {
    const map = /* @__PURE__ */ new Map();
    for (const pair of cookie.split(/; */)){
        if (!pair) continue;
        const splitAt = pair.indexOf("=");
        if (splitAt === -1) {
            map.set(pair, "true");
            continue;
        }
        const [key, value] = [
            pair.slice(0, splitAt),
            pair.slice(splitAt + 1)
        ];
        try {
            map.set(key, decodeURIComponent(value != null ? value : "true"));
        } catch  {}
    }
    return map;
}
function parseSetCookie(setCookie) {
    if (!setCookie) {
        return void 0;
    }
    const [[name, value], ...attributes] = parseCookie(setCookie);
    const { domain, expires, httponly, maxage, path, samesite, secure } = Object.fromEntries(attributes.map(([key, value2])=>[
            key.toLowerCase(),
            value2
        ]));
    const cookie = {
        name,
        value: decodeURIComponent(value),
        domain,
        ...expires && {
            expires: new Date(expires)
        },
        ...httponly && {
            httpOnly: true
        },
        ...typeof maxage === "string" && {
            maxAge: Number(maxage)
        },
        path,
        ...samesite && {
            sameSite: parseSameSite(samesite)
        },
        ...secure && {
            secure: true
        }
    };
    return compact(cookie);
}
function compact(t) {
    const newT = {};
    for(const key in t){
        if (t[key]) {
            newT[key] = t[key];
        }
    }
    return newT;
}
var SAME_SITE = [
    "strict",
    "lax",
    "none"
];
function parseSameSite(string) {
    string = string.toLowerCase();
    return SAME_SITE.includes(string) ? string : void 0;
}
function splitCookiesString(cookiesString) {
    if (!cookiesString) return [];
    var cookiesStrings = [];
    var pos = 0;
    var start;
    var ch;
    var lastComma;
    var nextStart;
    var cookiesSeparatorFound;
    function skipWhitespace() {
        while(pos < cookiesString.length && /\s/.test(cookiesString.charAt(pos))){
            pos += 1;
        }
        return pos < cookiesString.length;
    }
    function notSpecialChar() {
        ch = cookiesString.charAt(pos);
        return ch !== "=" && ch !== ";" && ch !== ",";
    }
    while(pos < cookiesString.length){
        start = pos;
        cookiesSeparatorFound = false;
        while(skipWhitespace()){
            ch = cookiesString.charAt(pos);
            if (ch === ",") {
                lastComma = pos;
                pos += 1;
                skipWhitespace();
                nextStart = pos;
                while(pos < cookiesString.length && notSpecialChar()){
                    pos += 1;
                }
                if (pos < cookiesString.length && cookiesString.charAt(pos) === "=") {
                    cookiesSeparatorFound = true;
                    pos = nextStart;
                    cookiesStrings.push(cookiesString.substring(start, lastComma));
                    start = pos;
                } else {
                    pos = lastComma + 1;
                }
            } else {
                pos += 1;
            }
        }
        if (!cookiesSeparatorFound || pos >= cookiesString.length) {
            cookiesStrings.push(cookiesString.substring(start, cookiesString.length));
        }
    }
    return cookiesStrings;
}
// src/request-cookies.ts
var RequestCookies = class {
    constructor(requestHeaders){
        /** @internal */ this._parsed = /* @__PURE__ */ new Map();
        this._headers = requestHeaders;
        const header = requestHeaders.get("cookie");
        if (header) {
            const parsed = parseCookie(header);
            for (const [name, value] of parsed){
                this._parsed.set(name, {
                    name,
                    value
                });
            }
        }
    }
    [Symbol.iterator]() {
        return this._parsed[Symbol.iterator]();
    }
    /**
   * The amount of cookies received from the client
   */ get size() {
        return this._parsed.size;
    }
    get(...args) {
        const name = typeof args[0] === "string" ? args[0] : args[0].name;
        return this._parsed.get(name);
    }
    getAll(...args) {
        var _a;
        const all = Array.from(this._parsed);
        if (!args.length) {
            return all.map(([_, value])=>value);
        }
        const name = typeof args[0] === "string" ? args[0] : (_a = args[0]) == null ? void 0 : _a.name;
        return all.filter(([n])=>n === name).map(([_, value])=>value);
    }
    has(name) {
        return this._parsed.has(name);
    }
    set(...args) {
        const [name, value] = args.length === 1 ? [
            args[0].name,
            args[0].value
        ] : args;
        const map = this._parsed;
        map.set(name, {
            name,
            value
        });
        this._headers.set("cookie", Array.from(map).map(([_, value2])=>stringifyCookie(value2)).join("; "));
        return this;
    }
    /**
   * Delete the cookies matching the passed name or names in the request.
   */ delete(names) {
        const map = this._parsed;
        const result = !Array.isArray(names) ? map.delete(names) : names.map((name)=>map.delete(name));
        this._headers.set("cookie", Array.from(map).map(([_, value])=>stringifyCookie(value)).join("; "));
        return result;
    }
    /**
   * Delete all the cookies in the cookies in the request.
   */ clear() {
        this.delete(Array.from(this._parsed.keys()));
        return this;
    }
    /**
   * Format the cookies in the request as a string for logging
   */ [Symbol.for("edge-runtime.inspect.custom")]() {
        return `RequestCookies ${JSON.stringify(Object.fromEntries(this._parsed))}`;
    }
    toString() {
        return [
            ...this._parsed.values()
        ].map((v)=>`${v.name}=${encodeURIComponent(v.value)}`).join("; ");
    }
};
// src/response-cookies.ts
var ResponseCookies = class {
    constructor(responseHeaders){
        /** @internal */ this._parsed = /* @__PURE__ */ new Map();
        var _a, _b;
        this._headers = responseHeaders;
        const setCookie = (_a = responseHeaders.getSetCookie) == null ? void 0 : _a.call(responseHeaders);
        (_b = responseHeaders.get("set-cookie")) != null ? _b : [];
        const cookieStrings = Array.isArray(setCookie) ? setCookie : // TODO: remove splitCookiesString when `getSetCookie` adoption is high enough in Node.js
        // https://developer.mozilla.org/en-US/docs/Web/API/Headers/getSetCookie#browser_compatibility
        splitCookiesString(setCookie);
        for (const cookieString of cookieStrings){
            const parsed = parseSetCookie(cookieString);
            if (parsed) this._parsed.set(parsed.name, parsed);
        }
    }
    /**
   * {@link https://wicg.github.io/cookie-store/#CookieStore-get CookieStore#get} without the Promise.
   */ get(...args) {
        const key = typeof args[0] === "string" ? args[0] : args[0].name;
        return this._parsed.get(key);
    }
    /**
   * {@link https://wicg.github.io/cookie-store/#CookieStore-getAll CookieStore#getAll} without the Promise.
   */ getAll(...args) {
        var _a;
        const all = Array.from(this._parsed.values());
        if (!args.length) {
            return all;
        }
        const key = typeof args[0] === "string" ? args[0] : (_a = args[0]) == null ? void 0 : _a.name;
        return all.filter((c)=>c.name === key);
    }
    has(name) {
        return this._parsed.has(name);
    }
    /**
   * {@link https://wicg.github.io/cookie-store/#CookieStore-set CookieStore#set} without the Promise.
   */ set(...args) {
        const [name, value, cookie] = args.length === 1 ? [
            args[0].name,
            args[0].value,
            args[0]
        ] : args;
        const map = this._parsed;
        map.set(name, normalizeCookie({
            name,
            value,
            ...cookie
        }));
        replace(map, this._headers);
        return this;
    }
    /**
   * {@link https://wicg.github.io/cookie-store/#CookieStore-delete CookieStore#delete} without the Promise.
   */ delete(...args) {
        const [name, path, domain] = typeof args[0] === "string" ? [
            args[0]
        ] : [
            args[0].name,
            args[0].path,
            args[0].domain
        ];
        return this.set({
            name,
            path,
            domain,
            value: "",
            expires: /* @__PURE__ */ new Date(0)
        });
    }
    [Symbol.for("edge-runtime.inspect.custom")]() {
        return `ResponseCookies ${JSON.stringify(Object.fromEntries(this._parsed))}`;
    }
    toString() {
        return [
            ...this._parsed.values()
        ].map(stringifyCookie).join("; ");
    }
};
function replace(bag, headers) {
    headers.delete("set-cookie");
    for (const [, value] of bag){
        const serialized = stringifyCookie(value);
        headers.append("set-cookie", serialized);
    }
}
function normalizeCookie(cookie = {
    name: "",
    value: ""
}) {
    if (typeof cookie.expires === "number") {
        cookie.expires = new Date(cookie.expires);
    }
    if (cookie.maxAge) {
        cookie.expires = new Date(Date.now() + cookie.maxAge * 1e3);
    }
    if (cookie.path === null || cookie.path === void 0) {
        cookie.path = "/";
    }
    return cookie;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);


/***/ }),

/***/ 104:
/***/ ((module) => {

"use strict";
var __dirname = "/";

(()=>{
    "use strict";
    if (typeof __nccwpck_require__ !== "undefined") __nccwpck_require__.ab = __dirname + "/";
    var e = {};
    (()=>{
        var r = e;
        /*!
 * cookie
 * Copyright(c) 2012-2014 Roman Shtylman
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */ r.parse = parse;
        r.serialize = serialize;
        var i = decodeURIComponent;
        var t = encodeURIComponent;
        var a = /; */;
        var n = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;
        function parse(e, r) {
            if (typeof e !== "string") {
                throw new TypeError("argument str must be a string");
            }
            var t = {};
            var n = r || {};
            var o = e.split(a);
            var s = n.decode || i;
            for(var p = 0; p < o.length; p++){
                var f = o[p];
                var u = f.indexOf("=");
                if (u < 0) {
                    continue;
                }
                var v = f.substr(0, u).trim();
                var c = f.substr(++u, f.length).trim();
                if ('"' == c[0]) {
                    c = c.slice(1, -1);
                }
                if (undefined == t[v]) {
                    t[v] = tryDecode(c, s);
                }
            }
            return t;
        }
        function serialize(e, r, i) {
            var a = i || {};
            var o = a.encode || t;
            if (typeof o !== "function") {
                throw new TypeError("option encode is invalid");
            }
            if (!n.test(e)) {
                throw new TypeError("argument name is invalid");
            }
            var s = o(r);
            if (s && !n.test(s)) {
                throw new TypeError("argument val is invalid");
            }
            var p = e + "=" + s;
            if (null != a.maxAge) {
                var f = a.maxAge - 0;
                if (isNaN(f) || !isFinite(f)) {
                    throw new TypeError("option maxAge is invalid");
                }
                p += "; Max-Age=" + Math.floor(f);
            }
            if (a.domain) {
                if (!n.test(a.domain)) {
                    throw new TypeError("option domain is invalid");
                }
                p += "; Domain=" + a.domain;
            }
            if (a.path) {
                if (!n.test(a.path)) {
                    throw new TypeError("option path is invalid");
                }
                p += "; Path=" + a.path;
            }
            if (a.expires) {
                if (typeof a.expires.toUTCString !== "function") {
                    throw new TypeError("option expires is invalid");
                }
                p += "; Expires=" + a.expires.toUTCString();
            }
            if (a.httpOnly) {
                p += "; HttpOnly";
            }
            if (a.secure) {
                p += "; Secure";
            }
            if (a.sameSite) {
                var u = typeof a.sameSite === "string" ? a.sameSite.toLowerCase() : a.sameSite;
                switch(u){
                    case true:
                        p += "; SameSite=Strict";
                        break;
                    case "lax":
                        p += "; SameSite=Lax";
                        break;
                    case "strict":
                        p += "; SameSite=Strict";
                        break;
                    case "none":
                        p += "; SameSite=None";
                        break;
                    default:
                        throw new TypeError("option sameSite is invalid");
                }
            }
            return p;
        }
        function tryDecode(e, r) {
            try {
                return r(e);
            } catch (r) {
                return e;
            }
        }
    })();
    module.exports = e;
})();


/***/ })

},
/******/ __webpack_require__ => { // webpackRuntimeModules
/******/ var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
/******/ var __webpack_exports__ = (__webpack_exec__(905));
/******/ (_ENTRIES = typeof _ENTRIES === "undefined" ? {} : _ENTRIES).middleware_middleware = __webpack_exports__;
/******/ }
]);
//# sourceMappingURL=middleware.js.map
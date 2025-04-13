import { canParseUrl } from './canParseUrl';
import { getValueBySymbol } from './getValueBySymbol';
export class FetchResponse extends Response {
    static isConfigurableStatusCode(status) {
        return status >= 200 && status <= 599;
    }
    static isRedirectResponse(status) {
        return FetchResponse.STATUS_CODES_WITH_REDIRECT.includes(status);
    }
    /**
     * Returns a boolean indicating whether the given response status
     * code represents a response that can have a body.
     */
    static isResponseWithBody(status) {
        return !FetchResponse.STATUS_CODES_WITHOUT_BODY.includes(status);
    }
    static setUrl(url, response) {
        if (!url || url === 'about:' || !canParseUrl(url)) {
            return;
        }
        const state = getValueBySymbol('state', response);
        if (state) {
            // In Undici, push the URL to the internal list of URLs.
            // This will respect the `response.url` getter logic correctly.
            state.urlList.push(new URL(url));
        }
        else {
            // In other libraries, redefine the `url` property directly.
            Object.defineProperty(response, 'url', {
                value: url,
                enumerable: true,
                configurable: true,
                writable: false,
            });
        }
    }
    /**
     * Parses the given raw HTTP headers into a Fetch API `Headers` instance.
     */
    static parseRawHeaders(rawHeaders) {
        const headers = new Headers();
        for (let line = 0; line < rawHeaders.length; line += 2) {
            headers.append(rawHeaders[line], rawHeaders[line + 1]);
        }
        return headers;
    }
    constructor(body, init = {}) {
        var _a;
        const status = (_a = init.status) !== null && _a !== void 0 ? _a : 200;
        const safeStatus = FetchResponse.isConfigurableStatusCode(status)
            ? status
            : 200;
        const finalBody = FetchResponse.isResponseWithBody(status) ? body : null;
        super(finalBody, Object.assign(Object.assign({}, init), { status: safeStatus }));
        if (status !== safeStatus) {
            /**
             * @note Undici keeps an internal "Symbol(state)" that holds
             * the actual value of response status. Update that in Node.js.
             */
            const state = getValueBySymbol('state', this);
            if (state) {
                state.status = status;
            }
            else {
                Object.defineProperty(this, 'status', {
                    value: status,
                    enumerable: true,
                    configurable: true,
                    writable: false,
                });
            }
        }
        FetchResponse.setUrl(init.url, this);
    }
}
/**
 * Response status codes for responses that cannot have body.
 * @see https://fetch.spec.whatwg.org/#statuses
 */
FetchResponse.STATUS_CODES_WITHOUT_BODY = [101, 103, 204, 205, 304];
FetchResponse.STATUS_CODES_WITH_REDIRECT = [301, 302, 303, 307, 308];

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { createNetworkError } from './createNetworkError';
const REQUEST_BODY_HEADERS = [
    'content-encoding',
    'content-language',
    'content-location',
    'content-type',
    'content-length',
];
const kRedirectCount = Symbol('kRedirectCount');
/**
 * @see https://github.com/nodejs/undici/blob/a6dac3149c505b58d2e6d068b97f4dc993da55f0/lib/web/fetch/index.js#L1210
 */
export function followFetchRedirect(request, response) {
    return __awaiter(this, void 0, void 0, function* () {
        if (response.status !== 303 && request.body != null) {
            return Promise.reject(createNetworkError());
        }
        const requestUrl = new URL(request.url);
        let locationUrl;
        try {
            // If the location is a relative URL, use the request URL as the base URL.
            locationUrl = new URL(response.headers.get('location'), request.url);
        }
        catch (error) {
            return Promise.reject(createNetworkError(error));
        }
        if (!(locationUrl.protocol === 'http:' || locationUrl.protocol === 'https:')) {
            return Promise.reject(createNetworkError('URL scheme must be a HTTP(S) scheme'));
        }
        if (Reflect.get(request, kRedirectCount) > 20) {
            return Promise.reject(createNetworkError('redirect count exceeded'));
        }
        Object.defineProperty(request, kRedirectCount, {
            value: (Reflect.get(request, kRedirectCount) || 0) + 1,
        });
        if (request.mode === 'cors' &&
            (locationUrl.username || locationUrl.password) &&
            !sameOrigin(requestUrl, locationUrl)) {
            return Promise.reject(createNetworkError('cross origin not allowed for request mode "cors"'));
        }
        const requestInit = {};
        if (([301, 302].includes(response.status) && request.method === 'POST') ||
            (response.status === 303 && !['HEAD', 'GET'].includes(request.method))) {
            requestInit.method = 'GET';
            requestInit.body = null;
            REQUEST_BODY_HEADERS.forEach((headerName) => {
                request.headers.delete(headerName);
            });
        }
        if (!sameOrigin(requestUrl, locationUrl)) {
            request.headers.delete('authorization');
            request.headers.delete('proxy-authorization');
            request.headers.delete('cookie');
            request.headers.delete('host');
        }
        /**
         * @note Undici "safely" extracts the request body.
         * I suspect we cannot dispatch this request again
         * since its body has been read and the stream is locked.
         */
        requestInit.headers = request.headers;
        return fetch(new Request(locationUrl, requestInit));
    });
}
/**
 * @see https://github.com/nodejs/undici/blob/a6dac3149c505b58d2e6d068b97f4dc993da55f0/lib/web/fetch/util.js#L761
 */
function sameOrigin(left, right) {
    if (left.origin === right.origin && left.origin === 'null') {
        return true;
    }
    if (left.protocol === right.protocol &&
        left.hostname === right.hostname &&
        left.port === right.port) {
        return true;
    }
    return false;
}

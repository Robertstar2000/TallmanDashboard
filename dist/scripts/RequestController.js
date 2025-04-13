import { invariant } from 'outvariant';
import { DeferredPromise } from '@open-draft/deferred-promise';
import { InterceptorError } from './InterceptorError';
const kRequestHandled = Symbol('kRequestHandled');
export const kResponsePromise = Symbol('kResponsePromise');
export class RequestController {
    constructor(request) {
        this.request = request;
        this[kRequestHandled] = false;
        this[kResponsePromise] = new DeferredPromise();
    }
    /**
     * Respond to this request with the given `Response` instance.
     * @example
     * controller.respondWith(new Response())
     * controller.respondWith(Response.json({ id }))
     * controller.respondWith(Response.error())
     */
    respondWith(response) {
        invariant.as(InterceptorError, !this[kRequestHandled], 'Failed to respond to the "%s %s" request: the "request" event has already been handled.', this.request.method, this.request.url);
        this[kRequestHandled] = true;
        this[kResponsePromise].resolve(response);
        /**
         * @note The request conrtoller doesn't do anything
         * apart from letting the interceptor await the response
         * provided by the developer through the response promise.
         * Each interceptor implements the actual respondWith/errorWith
         * logic based on that interceptor's needs.
         */
    }
    /**
     * Error this request with the given error.
     * @example
     * controller.errorWith()
     * controller.errorWith(new Error('Oops!'))
     */
    errorWith(error) {
        invariant.as(InterceptorError, !this[kRequestHandled], 'Failed to error the "%s %s" request: the "request" event has already been handled.', this.request.method, this.request.url);
        this[kRequestHandled] = true;
        /**
         * @note Resolve the response promise, not reject.
         * This helps us differentiate between unhandled exceptions
         * and intended errors ("errorWith") while waiting for the response.
         */
        this[kResponsePromise].resolve(error);
    }
}

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { RequestController } from '../../RequestController';
import { XMLHttpRequestController } from './XMLHttpRequestController';
import { handleRequest } from '../../utils/handleRequest';
/**
 * Create a proxied `XMLHttpRequest` class.
 * The proxied class establishes spies on certain methods,
 * allowing us to intercept requests and respond to them.
 */
export function createXMLHttpRequestProxy({ emitter, logger, }) {
    const XMLHttpRequestProxy = new Proxy(globalThis.XMLHttpRequest, {
        construct(target, args, newTarget) {
            logger.info('constructed new XMLHttpRequest');
            const originalRequest = Reflect.construct(target, args, newTarget);
            /**
             * @note Forward prototype descriptors onto the proxied object.
             * XMLHttpRequest is implemented in JSDOM in a way that assigns
             * a bunch of descriptors, like "set responseType()" on the prototype.
             * With this propagation, we make sure that those descriptors trigger
             * when the user operates with the proxied request instance.
             */
            const prototypeDescriptors = Object.getOwnPropertyDescriptors(target.prototype);
            for (const propertyName in prototypeDescriptors) {
                Reflect.defineProperty(originalRequest, propertyName, prototypeDescriptors[propertyName]);
            }
            const xhrRequestController = new XMLHttpRequestController(originalRequest, logger);
            xhrRequestController.onRequest = function (_a) {
                return __awaiter(this, arguments, void 0, function* ({ request, requestId }) {
                    const controller = new RequestController(request);
                    this.logger.info('awaiting mocked response...');
                    this.logger.info('emitting the "request" event for %s listener(s)...', emitter.listenerCount('request'));
                    const isRequestHandled = yield handleRequest({
                        request,
                        requestId,
                        controller,
                        emitter,
                        onResponse: (response) => __awaiter(this, void 0, void 0, function* () {
                            yield this.respondWith(response);
                        }),
                        onRequestError: () => {
                            this.errorWith(new TypeError('Network error'));
                        },
                        onError: (error) => {
                            this.logger.info('request errored!', { error });
                            if (error instanceof Error) {
                                this.errorWith(error);
                            }
                        },
                    });
                    if (!isRequestHandled) {
                        this.logger.info('no mocked response received, performing request as-is...');
                    }
                });
            };
            xhrRequestController.onResponse = function (_a) {
                return __awaiter(this, arguments, void 0, function* ({ response, isMockedResponse, request, requestId, }) {
                    this.logger.info('emitting the "response" event for %s listener(s)...', emitter.listenerCount('response'));
                    emitter.emit('response', {
                        response,
                        isMockedResponse,
                        request,
                        requestId,
                    });
                });
            };
            // Return the proxied request from the controller
            // so that the controller can react to the consumer's interactions
            // with this request (opening/sending/etc).
            return xhrRequestController.request;
        },
    });
    return XMLHttpRequestProxy;
}

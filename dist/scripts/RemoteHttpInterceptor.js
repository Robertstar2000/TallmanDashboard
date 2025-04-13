var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Interceptor } from './Interceptor';
import { BatchInterceptor } from './BatchInterceptor';
import { ClientRequestInterceptor } from './interceptors/ClientRequest';
import { XMLHttpRequestInterceptor } from './interceptors/XMLHttpRequest';
import { FetchInterceptor } from './interceptors/fetch';
import { handleRequest } from './utils/handleRequest';
import { RequestController } from './RequestController';
import { FetchResponse } from './utils/fetchUtils';
export class RemoteHttpInterceptor extends BatchInterceptor {
    constructor() {
        super({
            name: 'remote-interceptor',
            interceptors: [
                new ClientRequestInterceptor(),
                new XMLHttpRequestInterceptor(),
                new FetchInterceptor(),
            ],
        });
    }
    setup() {
        super.setup();
        let handleParentMessage;
        this.on('request', (_a) => __awaiter(this, [_a], void 0, function* ({ request, requestId, controller }) {
            var _b;
            // Send the stringified intercepted request to
            // the parent process where the remote resolver is established.
            const serializedRequest = JSON.stringify({
                id: requestId,
                method: request.method,
                url: request.url,
                headers: Array.from(request.headers.entries()),
                credentials: request.credentials,
                body: ['GET', 'HEAD'].includes(request.method)
                    ? null
                    : yield request.text(),
            });
            this.logger.info('sent serialized request to the child:', serializedRequest);
            (_b = process.send) === null || _b === void 0 ? void 0 : _b.call(process, `request:${serializedRequest}`);
            const responsePromise = new Promise((resolve) => {
                handleParentMessage = (message) => {
                    if (typeof message !== 'string') {
                        return resolve();
                    }
                    if (message.startsWith(`response:${requestId}`)) {
                        const [, serializedResponse] = message.match(/^response:.+?:(.+)$/) || [];
                        if (!serializedResponse) {
                            return resolve();
                        }
                        const responseInit = JSON.parse(serializedResponse);
                        const mockedResponse = new FetchResponse(responseInit.body, {
                            url: request.url,
                            status: responseInit.status,
                            statusText: responseInit.statusText,
                            headers: responseInit.headers,
                        });
                        /**
                         * @todo Support "errorWith" as well.
                         * This response handling from the child is incomplete.
                         */
                        controller.respondWith(mockedResponse);
                        return resolve();
                    }
                };
            });
            // Listen for the mocked response message from the parent.
            this.logger.info('add "message" listener to the parent process', handleParentMessage);
            process.addListener('message', handleParentMessage);
            return responsePromise;
        }));
        this.subscriptions.push(() => {
            process.removeListener('message', handleParentMessage);
        });
    }
}
export function requestReviver(key, value) {
    switch (key) {
        case 'url':
            return new URL(value);
        case 'headers':
            return new Headers(value);
        default:
            return value;
    }
}
export class RemoteHttpResolver extends Interceptor {
    constructor(options) {
        super(RemoteHttpResolver.symbol);
        this.process = options.process;
    }
    setup() {
        const logger = this.logger.extend('setup');
        const handleChildMessage = (message) => __awaiter(this, void 0, void 0, function* () {
            logger.info('received message from child!', message);
            if (typeof message !== 'string' || !message.startsWith('request:')) {
                logger.info('unknown message, ignoring...');
                return;
            }
            const [, serializedRequest] = message.match(/^request:(.+)$/) || [];
            if (!serializedRequest) {
                return;
            }
            const requestJson = JSON.parse(serializedRequest, requestReviver);
            logger.info('parsed intercepted request', requestJson);
            const request = new Request(requestJson.url, {
                method: requestJson.method,
                headers: new Headers(requestJson.headers),
                credentials: requestJson.credentials,
                body: requestJson.body,
            });
            const controller = new RequestController(request);
            yield handleRequest({
                request,
                requestId: requestJson.id,
                controller,
                emitter: this.emitter,
                onResponse: (response) => __awaiter(this, void 0, void 0, function* () {
                    this.logger.info('received mocked response!', { response });
                    const responseClone = response.clone();
                    const responseText = yield responseClone.text();
                    // // Send the mocked response to the child process.
                    const serializedResponse = JSON.stringify({
                        status: response.status,
                        statusText: response.statusText,
                        headers: Array.from(response.headers.entries()),
                        body: responseText,
                    });
                    this.process.send(`response:${requestJson.id}:${serializedResponse}`, (error) => {
                        if (error) {
                            return;
                        }
                        // Emit an optimistic "response" event at this point,
                        // not to rely on the back-and-forth signaling for the sake of the event.
                        this.emitter.emit('response', {
                            request,
                            requestId: requestJson.id,
                            response: responseClone,
                            isMockedResponse: true,
                        });
                    });
                    logger.info('sent serialized mocked response to the parent:', serializedResponse);
                }),
                onRequestError: (response) => {
                    this.logger.info('received a network error!', { response });
                    throw new Error('Not implemented');
                },
                onError: (error) => {
                    this.logger.info('request has errored!', { error });
                    throw new Error('Not implemented');
                },
            });
        });
        this.subscriptions.push(() => {
            this.process.removeListener('message', handleChildMessage);
            logger.info('removed the "message" listener from the child process!');
        });
        logger.info('adding a "message" listener to the child process');
        this.process.addListener('message', handleChildMessage);
        this.process.once('error', () => this.dispose());
        this.process.once('exit', () => this.dispose());
    }
}
RemoteHttpResolver.symbol = Symbol('remote-resolver');

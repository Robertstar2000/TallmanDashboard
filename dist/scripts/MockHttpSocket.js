var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import net from 'node:net';
import { HTTPParser, } from '_http_common';
import { STATUS_CODES, IncomingMessage, ServerResponse } from 'node:http';
import { Readable } from 'node:stream';
import { invariant } from 'outvariant';
import { INTERNAL_REQUEST_ID_HEADER_NAME } from '../../Interceptor';
import { MockSocket } from '../Socket/MockSocket';
import { isPropertyAccessible } from '../../utils/isPropertyAccessible';
import { baseUrlFromConnectionOptions } from '../Socket/utils/baseUrlFromConnectionOptions';
import { createServerErrorResponse } from '../../utils/responseUtils';
import { createRequestId } from '../../createRequestId';
import { getRawFetchHeaders } from './utils/recordRawHeaders';
import { FetchResponse } from '../../utils/fetchUtils';
export const kRequestId = Symbol('kRequestId');
export class MockHttpSocket extends MockSocket {
    constructor(options) {
        super({
            write: (chunk, encoding, callback) => {
                var _a;
                // Buffer the writes so they can be flushed in case of the original connection
                // and when reading the request body in the interceptor. If the connection has
                // been established, no need to buffer the chunks anymore, they will be forwarded.
                if (this.socketState !== 'passthrough') {
                    this.writeBuffer.push([chunk, encoding, callback]);
                }
                if (chunk) {
                    /**
                     * Forward any writes to the mock socket to the underlying original socket.
                     * This ensures functional duplex connections, like WebSocket.
                     * @see https://github.com/mswjs/interceptors/issues/682
                     */
                    if (this.socketState === 'passthrough') {
                        (_a = this.originalSocket) === null || _a === void 0 ? void 0 : _a.write(chunk, encoding, callback);
                    }
                    this.requestParser.execute(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
                }
            },
            read: (chunk) => {
                if (chunk !== null) {
                    /**
                     * @todo We need to free the parser if the connection has been
                     * upgraded to a non-HTTP protocol. It won't be able to parse data
                     * from that point onward anyway. No need to keep it in memory.
                     */
                    this.responseParser.execute(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
                }
            },
        });
        this.writeBuffer = [];
        this.socketState = 'unknown';
        this.onRequestStart = (versionMajor, versionMinor, rawHeaders, _, path, __, ___, ____, shouldKeepAlive) => {
            var _a;
            this.shouldKeepAlive = shouldKeepAlive;
            const url = new URL(path, this.baseUrl);
            const method = ((_a = this.connectionOptions.method) === null || _a === void 0 ? void 0 : _a.toUpperCase()) || 'GET';
            const headers = FetchResponse.parseRawHeaders(rawHeaders);
            const canHaveBody = method !== 'GET' && method !== 'HEAD';
            // Translate the basic authorization in the URL to the request header.
            // Constructing a Request instance with a URL containing auth is no-op.
            if (url.username || url.password) {
                if (!headers.has('authorization')) {
                    headers.set('authorization', `Basic ${url.username}:${url.password}`);
                }
                url.username = '';
                url.password = '';
            }
            // Create a new stream for each request.
            // If this Socket is reused for multiple requests,
            // this ensures that each request gets its own stream.
            // One Socket instance can only handle one request at a time.
            if (canHaveBody) {
                this.requestStream = new Readable({
                    /**
                     * @note Provide the `read()` method so a `Readable` could be
                     * used as the actual request body (the stream calls "read()").
                     * We control the queue in the onRequestBody/End functions.
                     */
                    read: () => {
                        // If the user attempts to read the request body,
                        // flush the write buffer to trigger the callbacks.
                        // This way, if the request stream ends in the write callback,
                        // it will indeed end correctly.
                        this.flushWriteBuffer();
                    },
                });
            }
            const requestId = createRequestId();
            this.request = new Request(url, {
                method,
                headers,
                credentials: 'same-origin',
                // @ts-expect-error Undocumented Fetch property.
                duplex: canHaveBody ? 'half' : undefined,
                body: canHaveBody ? Readable.toWeb(this.requestStream) : null,
            });
            Reflect.set(this.request, kRequestId, requestId);
            // Skip handling the request that's already being handled
            // by another (parent) interceptor. For example, XMLHttpRequest
            // is often implemented via ClientRequest in Node.js (e.g. JSDOM).
            // In that case, XHR interceptor will bubble down to the ClientRequest
            // interceptor. No need to try to handle that request again.
            /**
             * @fixme Stop relying on the "X-Request-Id" request header
             * to figure out if one interceptor has been invoked within another.
             * @see https://github.com/mswjs/interceptors/issues/378
             */
            if (this.request.headers.has(INTERNAL_REQUEST_ID_HEADER_NAME)) {
                this.passthrough();
                return;
            }
            this.onRequest({
                requestId,
                request: this.request,
                socket: this,
            });
        };
        this.onResponseStart = (versionMajor, versionMinor, rawHeaders, method, url, status, statusText) => {
            const headers = FetchResponse.parseRawHeaders(rawHeaders);
            const response = new FetchResponse(
            /**
             * @note The Fetch API response instance exposed to the consumer
             * is created over the response stream of the HTTP parser. It is NOT
             * related to the Socket instance. This way, you can read response body
             * in response listener while the Socket instance delays the emission
             * of "end" and other events until those response listeners are finished.
             */
            FetchResponse.isResponseWithBody(status)
                ? Readable.toWeb((this.responseStream = new Readable({ read() { } })))
                : null, {
                url,
                status,
                statusText,
                headers,
            });
            invariant(this.request, 'Failed to handle a response: request does not exist');
            FetchResponse.setUrl(this.request.url, response);
            /**
             * @fixme Stop relying on the "X-Request-Id" request header
             * to figure out if one interceptor has been invoked within another.
             * @see https://github.com/mswjs/interceptors/issues/378
             */
            if (this.request.headers.has(INTERNAL_REQUEST_ID_HEADER_NAME)) {
                return;
            }
            this.responseListenersPromise = this.onResponse({
                response,
                isMockedResponse: this.socketState === 'mock',
                requestId: Reflect.get(this.request, kRequestId),
                request: this.request,
                socket: this,
            });
        };
        this.connectionOptions = options.connectionOptions;
        this.createConnection = options.createConnection;
        this.onRequest = options.onRequest;
        this.onResponse = options.onResponse;
        this.baseUrl = baseUrlFromConnectionOptions(this.connectionOptions);
        // Request parser.
        this.requestParser = new HTTPParser();
        this.requestParser.initialize(HTTPParser.REQUEST, {});
        this.requestParser[HTTPParser.kOnHeadersComplete] =
            this.onRequestStart.bind(this);
        this.requestParser[HTTPParser.kOnBody] = this.onRequestBody.bind(this);
        this.requestParser[HTTPParser.kOnMessageComplete] =
            this.onRequestEnd.bind(this);
        // Response parser.
        this.responseParser = new HTTPParser();
        this.responseParser.initialize(HTTPParser.RESPONSE, {});
        this.responseParser[HTTPParser.kOnHeadersComplete] =
            this.onResponseStart.bind(this);
        this.responseParser[HTTPParser.kOnBody] = this.onResponseBody.bind(this);
        this.responseParser[HTTPParser.kOnMessageComplete] =
            this.onResponseEnd.bind(this);
        // Once the socket is finished, nothing can write to it
        // anymore. It has also flushed any buffered chunks.
        this.once('finish', () => this.requestParser.free());
        if (this.baseUrl.protocol === 'https:') {
            Reflect.set(this, 'encrypted', true);
            // The server certificate is not the same as a CA
            // passed to the TLS socket connection options.
            Reflect.set(this, 'authorized', false);
            Reflect.set(this, 'getProtocol', () => 'TLSv1.3');
            Reflect.set(this, 'getSession', () => undefined);
            Reflect.set(this, 'isSessionReused', () => false);
        }
    }
    emit(event, ...args) {
        const emitEvent = super.emit.bind(this, event, ...args);
        if (this.responseListenersPromise) {
            this.responseListenersPromise.finally(emitEvent);
            return this.listenerCount(event) > 0;
        }
        return emitEvent();
    }
    destroy(error) {
        // Destroy the response parser when the socket gets destroyed.
        // Normally, we shoud listen to the "close" event but it
        // can be suppressed by using the "emitClose: false" option.
        this.responseParser.free();
        if (error) {
            this.emit('error', error);
        }
        return super.destroy(error);
    }
    /**
     * Establish this Socket connection as-is and pipe
     * its data/events through this Socket.
     */
    passthrough() {
        this.socketState = 'passthrough';
        if (this.destroyed) {
            return;
        }
        const socket = this.createConnection();
        this.originalSocket = socket;
        // If the developer destroys the socket, destroy the original connection.
        this.once('error', (error) => {
            socket.destroy(error);
        });
        this.address = socket.address.bind(socket);
        // Flush the buffered "socket.write()" calls onto
        // the original socket instance (i.e. write request body).
        // Exhaust the "requestBuffer" in case this Socket
        // gets reused for different requests.
        let writeArgs;
        let headersWritten = false;
        while ((writeArgs = this.writeBuffer.shift())) {
            if (writeArgs !== undefined) {
                if (!headersWritten) {
                    const [chunk, encoding, callback] = writeArgs;
                    const chunkString = chunk.toString();
                    const chunkBeforeRequestHeaders = chunkString.slice(0, chunkString.indexOf('\r\n') + 2);
                    const chunkAfterRequestHeaders = chunkString.slice(chunk.indexOf('\r\n\r\n'));
                    const rawRequestHeaders = getRawFetchHeaders(this.request.headers);
                    const requestHeadersString = rawRequestHeaders
                        // Skip the internal request ID deduplication header.
                        .filter(([name]) => {
                        return name.toLowerCase() !== INTERNAL_REQUEST_ID_HEADER_NAME;
                    })
                        .map(([name, value]) => `${name}: ${value}`)
                        .join('\r\n');
                    // Modify the HTTP request message headers
                    // to reflect any changes to the request headers
                    // from the "request" event listener.
                    const headersChunk = `${chunkBeforeRequestHeaders}${requestHeadersString}${chunkAfterRequestHeaders}`;
                    socket.write(headersChunk, encoding, callback);
                    headersWritten = true;
                    continue;
                }
                socket.write(...writeArgs);
            }
        }
        // Forward TLS Socket properties onto this Socket instance
        // in the case of a TLS/SSL connection.
        if (Reflect.get(socket, 'encrypted')) {
            const tlsProperties = [
                'encrypted',
                'authorized',
                'getProtocol',
                'getSession',
                'isSessionReused',
            ];
            tlsProperties.forEach((propertyName) => {
                Object.defineProperty(this, propertyName, {
                    enumerable: true,
                    get: () => {
                        const value = Reflect.get(socket, propertyName);
                        return typeof value === 'function' ? value.bind(socket) : value;
                    },
                });
            });
        }
        socket
            .on('lookup', (...args) => this.emit('lookup', ...args))
            .on('connect', () => {
            this.connecting = socket.connecting;
            this.emit('connect');
        })
            .on('secureConnect', () => this.emit('secureConnect'))
            .on('secure', () => this.emit('secure'))
            .on('session', (session) => this.emit('session', session))
            .on('ready', () => this.emit('ready'))
            .on('drain', () => this.emit('drain'))
            .on('data', (chunk) => {
            // Push the original response to this socket
            // so it triggers the HTTP response parser. This unifies
            // the handling pipeline for original and mocked response.
            this.push(chunk);
        })
            .on('error', (error) => {
            Reflect.set(this, '_hadError', Reflect.get(socket, '_hadError'));
            this.emit('error', error);
        })
            .on('resume', () => this.emit('resume'))
            .on('timeout', () => this.emit('timeout'))
            .on('prefinish', () => this.emit('prefinish'))
            .on('finish', () => this.emit('finish'))
            .on('close', (hadError) => this.emit('close', hadError))
            .on('end', () => this.emit('end'));
    }
    /**
     * Convert the given Fetch API `Response` instance to an
     * HTTP message and push it to the socket.
     */
    respondWith(response) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            // Ignore the mocked response if the socket has been destroyed
            // (e.g. aborted or timed out),
            if (this.destroyed) {
                return;
            }
            // Handle "type: error" responses.
            if (isPropertyAccessible(response, 'type') && response.type === 'error') {
                this.errorWith(new TypeError('Network error'));
                return;
            }
            // First, emit all the connection events
            // to emulate a successful connection.
            this.mockConnect();
            this.socketState = 'mock';
            // Flush the write buffer to trigger write callbacks
            // if it hasn't been flushed already (e.g. someone started reading request stream).
            this.flushWriteBuffer();
            // Create a `ServerResponse` instance to delegate HTTP message parsing,
            // Transfer-Encoding, and other things to Node.js internals.
            const serverResponse = new ServerResponse(new IncomingMessage(this));
            /**
             * Assign a mock socket instance to the server response to
             * spy on the response chunk writes. Push the transformed response chunks
             * to this `MockHttpSocket` instance to trigger the "data" event.
             * @note Providing the same `MockSocket` instance when creating `ServerResponse`
             * does not have the same effect.
             * @see https://github.com/nodejs/node/blob/10099bb3f7fd97bb9dd9667188426866b3098e07/test/parallel/test-http-server-response-standalone.js#L32
             */
            serverResponse.assignSocket(new MockSocket({
                write: (chunk, encoding, callback) => {
                    this.push(chunk, encoding);
                    callback === null || callback === void 0 ? void 0 : callback();
                },
                read() { },
            }));
            /**
             * @note Remove the `Connection` and `Date` response headers
             * injected by `ServerResponse` by default. Those are required
             * from the server but the interceptor is NOT technically a server.
             * It's confusing to add response headers that the developer didn't
             * specify themselves. They can always add these if they wish.
             * @see https://www.rfc-editor.org/rfc/rfc9110#field.date
             * @see https://www.rfc-editor.org/rfc/rfc9110#field.connection
             */
            serverResponse.removeHeader('connection');
            serverResponse.removeHeader('date');
            const rawResponseHeaders = getRawFetchHeaders(response.headers);
            /**
             * @note Call `.writeHead` in order to set the raw response headers
             * in the same case as they were provided by the developer. Using
             * `.setHeader()`/`.appendHeader()` normalizes header names.
             */
            serverResponse.writeHead(response.status, response.statusText || STATUS_CODES[response.status], rawResponseHeaders);
            // If the developer destroy the socket, gracefully destroy the response.
            this.once('error', () => {
                serverResponse.destroy();
            });
            if (response.body) {
                try {
                    const reader = response.body.getReader();
                    while (true) {
                        const { done, value } = yield reader.read();
                        if (done) {
                            serverResponse.end();
                            break;
                        }
                        serverResponse.write(value);
                    }
                }
                catch (error) {
                    // Coerce response stream errors to 500 responses.
                    this.respondWith(createServerErrorResponse(error));
                    return;
                }
            }
            else {
                serverResponse.end();
            }
            // Close the socket if the connection wasn't marked as keep-alive.
            if (!this.shouldKeepAlive) {
                this.emit('readable');
                /**
                 * @todo @fixme This is likely a hack.
                 * Since we push null to the socket, it never propagates to the
                 * parser, and the parser never calls "onResponseEnd" to close
                 * the response stream. We are closing the stream here manually
                 * but that shouldn't be the case.
                 */
                (_a = this.responseStream) === null || _a === void 0 ? void 0 : _a.push(null);
                this.push(null);
            }
        });
    }
    /**
     * Close this socket connection with the given error.
     */
    errorWith(error) {
        this.destroy(error);
    }
    mockConnect() {
        // Calling this method immediately puts the socket
        // into the connected state.
        this.connecting = false;
        const isIPv6 = net.isIPv6(this.connectionOptions.hostname) ||
            this.connectionOptions.family === 6;
        const addressInfo = {
            address: isIPv6 ? '::1' : '127.0.0.1',
            family: isIPv6 ? 'IPv6' : 'IPv4',
            port: this.connectionOptions.port,
        };
        // Return fake address information for the socket.
        this.address = () => addressInfo;
        this.emit('lookup', null, addressInfo.address, addressInfo.family === 'IPv6' ? 6 : 4, this.connectionOptions.host);
        this.emit('connect');
        this.emit('ready');
        if (this.baseUrl.protocol === 'https:') {
            this.emit('secure');
            this.emit('secureConnect');
            // A single TLS connection is represented by two "session" events.
            this.emit('session', this.connectionOptions.session ||
                Buffer.from('mock-session-renegotiate'));
            this.emit('session', Buffer.from('mock-session-resume'));
        }
    }
    flushWriteBuffer() {
        for (const writeCall of this.writeBuffer) {
            if (typeof writeCall[2] === 'function') {
                writeCall[2]();
                /**
                 * @note Remove the callback from the write call
                 * so it doesn't get called twice on passthrough
                 * if `request.end()` was called within `request.write()`.
                 * @see https://github.com/mswjs/interceptors/issues/684
                 */
                writeCall[2] = undefined;
            }
        }
    }
    onRequestBody(chunk) {
        invariant(this.requestStream, 'Failed to write to a request stream: stream does not exist');
        this.requestStream.push(chunk);
    }
    onRequestEnd() {
        // Request end can be called for requests without body.
        if (this.requestStream) {
            this.requestStream.push(null);
        }
    }
    onResponseBody(chunk) {
        invariant(this.responseStream, 'Failed to write to a response stream: stream does not exist');
        this.responseStream.push(chunk);
    }
    onResponseEnd() {
        // Response end can be called for responses without body.
        if (this.responseStream) {
            this.responseStream.push(null);
        }
    }
}

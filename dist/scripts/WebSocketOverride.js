var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { invariant } from 'outvariant';
import { bindEvent } from './utils/bindEvent';
import { CloseEvent } from './utils/events';
import { DeferredPromise } from '@open-draft/deferred-promise';
const WEBSOCKET_CLOSE_CODE_RANGE_ERROR = 'InvalidAccessError: close code out of user configurable range';
export const kPassthroughPromise = Symbol('kPassthroughPromise');
export const kOnSend = Symbol('kOnSend');
export const kClose = Symbol('kClose');
export class WebSocketOverride extends EventTarget {
    constructor(url, protocols) {
        super();
        this.CONNECTING = 0;
        this.OPEN = 1;
        this.CLOSING = 2;
        this.CLOSED = 3;
        this._onopen = null;
        this._onmessage = null;
        this._onerror = null;
        this._onclose = null;
        this.url = url.toString();
        this.protocol = '';
        this.extensions = '';
        this.binaryType = 'blob';
        this.readyState = this.CONNECTING;
        this.bufferedAmount = 0;
        this[kPassthroughPromise] = new DeferredPromise();
        queueMicrotask(() => __awaiter(this, void 0, void 0, function* () {
            if (yield this[kPassthroughPromise]) {
                return;
            }
            this.protocol =
                typeof protocols === 'string'
                    ? protocols
                    : Array.isArray(protocols) && protocols.length > 0
                        ? protocols[0]
                        : '';
            /**
             * @note Check that nothing has prevented this connection
             * (e.g. called `client.close()` in the connection listener).
             * If the connection has been prevented, never dispatch the open event,.
             */
            if (this.readyState === this.CONNECTING) {
                this.readyState = this.OPEN;
                this.dispatchEvent(bindEvent(this, new Event('open')));
            }
        }));
    }
    set onopen(listener) {
        this.removeEventListener('open', this._onopen);
        this._onopen = listener;
        if (listener !== null) {
            this.addEventListener('open', listener);
        }
    }
    get onopen() {
        return this._onopen;
    }
    set onmessage(listener) {
        this.removeEventListener('message', this._onmessage);
        this._onmessage = listener;
        if (listener !== null) {
            this.addEventListener('message', listener);
        }
    }
    get onmessage() {
        return this._onmessage;
    }
    set onerror(listener) {
        this.removeEventListener('error', this._onerror);
        this._onerror = listener;
        if (listener !== null) {
            this.addEventListener('error', listener);
        }
    }
    get onerror() {
        return this._onerror;
    }
    set onclose(listener) {
        this.removeEventListener('close', this._onclose);
        this._onclose = listener;
        if (listener !== null) {
            this.addEventListener('close', listener);
        }
    }
    get onclose() {
        return this._onclose;
    }
    /**
     * @see https://websockets.spec.whatwg.org/#ref-for-dom-websocket-send%E2%91%A0
     */
    send(data) {
        if (this.readyState === this.CONNECTING) {
            this.close();
            throw new DOMException('InvalidStateError');
        }
        // Sending when the socket is about to close
        // discards the sent data.
        if (this.readyState === this.CLOSING || this.readyState === this.CLOSED) {
            return;
        }
        // Buffer the data to send in this even loop
        // but send it in the next.
        this.bufferedAmount += getDataSize(data);
        queueMicrotask(() => {
            var _a;
            // This is a bit optimistic but since no actual data transfer
            // is involved, all the data will be "sent" on the next tick.
            this.bufferedAmount = 0;
            /**
             * @note Notify the parent about outgoing data.
             * This notifies the transport and the connection
             * listens to the outgoing data to emit the "message" event.
             */
            (_a = this[kOnSend]) === null || _a === void 0 ? void 0 : _a.call(this, data);
        });
    }
    close(code = 1000, reason) {
        invariant(code, WEBSOCKET_CLOSE_CODE_RANGE_ERROR);
        invariant(code === 1000 || (code >= 3000 && code <= 4999), WEBSOCKET_CLOSE_CODE_RANGE_ERROR);
        this[kClose](code, reason);
    }
    [kClose](code = 1000, reason, wasClean = true) {
        /**
         * @note Move this check here so that even internall closures,
         * like those triggered by the `server` connection, are not
         * performed twice.
         */
        if (this.readyState === this.CLOSING || this.readyState === this.CLOSED) {
            return;
        }
        this.readyState = this.CLOSING;
        queueMicrotask(() => {
            this.readyState = this.CLOSED;
            this.dispatchEvent(bindEvent(this, new CloseEvent('close', {
                code,
                reason,
                wasClean,
            })));
            // Remove all event listeners once the socket is closed.
            this._onopen = null;
            this._onmessage = null;
            this._onerror = null;
            this._onclose = null;
        });
    }
    addEventListener(type, listener, options) {
        return super.addEventListener(type, listener, options);
    }
    removeEventListener(type, callback, options) {
        return super.removeEventListener(type, callback, options);
    }
}
WebSocketOverride.CONNECTING = 0;
WebSocketOverride.OPEN = 1;
WebSocketOverride.CLOSING = 2;
WebSocketOverride.CLOSED = 3;
function getDataSize(data) {
    if (typeof data === 'string') {
        return data.length;
    }
    if (data instanceof Blob) {
        return data.size;
    }
    return data.byteLength;
}

import { EventPolyfill } from '../polyfills/EventPolyfill';
import { ProgressEventPolyfill } from '../polyfills/ProgressEventPolyfill';
const SUPPORTS_PROGRESS_EVENT = typeof ProgressEvent !== 'undefined';
export function createEvent(target, type, init) {
    const progressEvents = [
        'error',
        'progress',
        'loadstart',
        'loadend',
        'load',
        'timeout',
        'abort',
    ];
    /**
     * `ProgressEvent` is not supported in React Native.
     * @see https://github.com/mswjs/interceptors/issues/40
     */
    const ProgressEventClass = SUPPORTS_PROGRESS_EVENT
        ? ProgressEvent
        : ProgressEventPolyfill;
    const event = progressEvents.includes(type)
        ? new ProgressEventClass(type, {
            lengthComputable: true,
            loaded: (init === null || init === void 0 ? void 0 : init.loaded) || 0,
            total: (init === null || init === void 0 ? void 0 : init.total) || 0,
        })
        : new EventPolyfill(type, {
            target,
            currentTarget: target,
        });
    return event;
}

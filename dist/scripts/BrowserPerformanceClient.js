/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Constants, Logger, PerformanceClient, } from "@azure/msal-common/browser";
import { name, version } from "../packageMetadata.js";
import { BROWSER_PERF_ENABLED_KEY, BrowserCacheLocation, } from "../utils/BrowserConstants.js";
import * as BrowserCrypto from "../crypto/BrowserCrypto.js";
/**
 * Returns browser performance measurement module if session flag is enabled. Returns undefined otherwise.
 */
function getPerfMeasurementModule() {
    let sessionStorage;
    try {
        sessionStorage = window[BrowserCacheLocation.SessionStorage];
        const perfEnabled = sessionStorage === null || sessionStorage === void 0 ? void 0 : sessionStorage.getItem(BROWSER_PERF_ENABLED_KEY);
        if (Number(perfEnabled) === 1) {
            return import("./BrowserPerformanceMeasurement.js");
        }
        // Mute errors if it's a non-browser environment or cookies are blocked.
    }
    catch (e) { }
    return undefined;
}
/**
 * Returns boolean, indicating whether browser supports window.performance.now() function.
 */
function supportsBrowserPerformanceNow() {
    return (typeof window !== "undefined" &&
        typeof window.performance !== "undefined" &&
        typeof window.performance.now === "function");
}
/**
 * Returns event duration in milliseconds using window performance API if available. Returns undefined otherwise.
 * @param startTime {DOMHighResTimeStamp | undefined}
 * @returns {number | undefined}
 */
function getPerfDurationMs(startTime) {
    if (!startTime || !supportsBrowserPerformanceNow()) {
        return undefined;
    }
    return Math.round(window.performance.now() - startTime);
}
export class BrowserPerformanceClient extends PerformanceClient {
    constructor(configuration, intFields, abbreviations) {
        var _a, _b;
        super(configuration.auth.clientId, configuration.auth.authority || `${Constants.DEFAULT_AUTHORITY}`, new Logger(((_a = configuration.system) === null || _a === void 0 ? void 0 : _a.loggerOptions) || {}, name, version), name, version, ((_b = configuration.telemetry) === null || _b === void 0 ? void 0 : _b.application) || {
            appName: "",
            appVersion: "",
        }, intFields, abbreviations);
    }
    generateId() {
        return BrowserCrypto.createNewGuid();
    }
    getPageVisibility() {
        var _a;
        return ((_a = document.visibilityState) === null || _a === void 0 ? void 0 : _a.toString()) || null;
    }
    deleteIncompleteSubMeasurements(inProgressEvent) {
        var _a;
        void ((_a = getPerfMeasurementModule()) === null || _a === void 0 ? void 0 : _a.then((module) => {
            const rootEvent = this.eventsByCorrelationId.get(inProgressEvent.event.correlationId);
            const isRootEvent = rootEvent &&
                rootEvent.eventId === inProgressEvent.event.eventId;
            const incompleteMeasurements = [];
            if (isRootEvent && (rootEvent === null || rootEvent === void 0 ? void 0 : rootEvent.incompleteSubMeasurements)) {
                rootEvent.incompleteSubMeasurements.forEach((subMeasurement) => {
                    incompleteMeasurements.push(Object.assign({}, subMeasurement));
                });
            }
            // Clean up remaining marks for incomplete sub-measurements
            module.BrowserPerformanceMeasurement.flushMeasurements(inProgressEvent.event.correlationId, incompleteMeasurements);
        }));
    }
    /**
     * Starts measuring performance for a given operation. Returns a function that should be used to end the measurement.
     * Also captures browser page visibilityState.
     *
     * @param {PerformanceEvents} measureName
     * @param {?string} [correlationId]
     * @returns {((event?: Partial<PerformanceEvent>) => PerformanceEvent| null)}
     */
    startMeasurement(measureName, correlationId) {
        var _a;
        // Capture page visibilityState and then invoke start/end measurement
        const startPageVisibility = this.getPageVisibility();
        const inProgressEvent = super.startMeasurement(measureName, correlationId);
        const startTime = supportsBrowserPerformanceNow()
            ? window.performance.now()
            : undefined;
        const browserMeasurement = (_a = getPerfMeasurementModule()) === null || _a === void 0 ? void 0 : _a.then((module) => {
            return new module.BrowserPerformanceMeasurement(measureName, inProgressEvent.event.correlationId);
        });
        void (browserMeasurement === null || browserMeasurement === void 0 ? void 0 : browserMeasurement.then((measurement) => measurement.startMeasurement()));
        return Object.assign(Object.assign({}, inProgressEvent), { end: (event, error) => {
                const res = inProgressEvent.end(Object.assign(Object.assign({}, event), { startPageVisibility, endPageVisibility: this.getPageVisibility(), durationMs: getPerfDurationMs(startTime) }), error);
                void (browserMeasurement === null || browserMeasurement === void 0 ? void 0 : browserMeasurement.then((measurement) => measurement.endMeasurement()));
                this.deleteIncompleteSubMeasurements(inProgressEvent);
                return res;
            }, discard: () => {
                inProgressEvent.discard();
                void (browserMeasurement === null || browserMeasurement === void 0 ? void 0 : browserMeasurement.then((measurement) => measurement.flushMeasurement()));
                this.deleteIncompleteSubMeasurements(inProgressEvent);
            } });
    }
    /**
     * Adds pre-queue time to preQueueTimeByCorrelationId map.
     * @param {PerformanceEvents} eventName
     * @param {?string} correlationId
     * @returns
     */
    setPreQueueTime(eventName, correlationId) {
        if (!supportsBrowserPerformanceNow()) {
            this.logger.trace(`BrowserPerformanceClient: window performance API not available, unable to set telemetry queue time for ${eventName}`);
            return;
        }
        if (!correlationId) {
            this.logger.trace(`BrowserPerformanceClient: correlationId for ${eventName} not provided, unable to set telemetry queue time`);
            return;
        }
        const preQueueEvent = this.preQueueTimeByCorrelationId.get(correlationId);
        /**
         * Manually complete queue measurement if there is an incomplete pre-queue event.
         * Incomplete pre-queue events are instrumentation bugs that should be fixed.
         */
        if (preQueueEvent) {
            this.logger.trace(`BrowserPerformanceClient: Incomplete pre-queue ${preQueueEvent.name} found`, correlationId);
            this.addQueueMeasurement(preQueueEvent.name, correlationId, undefined, true);
        }
        this.preQueueTimeByCorrelationId.set(correlationId, {
            name: eventName,
            time: window.performance.now(),
        });
    }
    /**
     * Calculates and adds queue time measurement for given performance event.
     *
     * @param {PerformanceEvents} eventName
     * @param {?string} correlationId
     * @param {?number} queueTime
     * @param {?boolean} manuallyCompleted - indicator for manually completed queue measurements
     * @returns
     */
    addQueueMeasurement(eventName, correlationId, queueTime, manuallyCompleted) {
        if (!supportsBrowserPerformanceNow()) {
            this.logger.trace(`BrowserPerformanceClient: window performance API not available, unable to add queue measurement for ${eventName}`);
            return;
        }
        if (!correlationId) {
            this.logger.trace(`BrowserPerformanceClient: correlationId for ${eventName} not provided, unable to add queue measurement`);
            return;
        }
        const preQueueTime = super.getPreQueueTime(eventName, correlationId);
        if (!preQueueTime) {
            return;
        }
        const currentTime = window.performance.now();
        const resQueueTime = queueTime || super.calculateQueuedTime(preQueueTime, currentTime);
        return super.addQueueMeasurement(eventName, correlationId, resQueueTime, manuallyCompleted);
    }
}

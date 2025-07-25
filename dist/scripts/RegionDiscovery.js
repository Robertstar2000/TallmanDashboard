/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Constants, RegionDiscoverySources, ResponseCodes, } from "../utils/Constants.js";
import { PerformanceEvents } from "../telemetry/performance/PerformanceEvent.js";
import { invokeAsync } from "../utils/FunctionWrappers.js";
export class RegionDiscovery {
    constructor(networkInterface, logger, performanceClient, correlationId) {
        this.networkInterface = networkInterface;
        this.logger = logger;
        this.performanceClient = performanceClient;
        this.correlationId = correlationId;
    }
    /**
     * Detect the region from the application's environment.
     *
     * @returns Promise<string | null>
     */
    detectRegion(environmentRegion, regionDiscoveryMetadata) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            (_a = this.performanceClient) === null || _a === void 0 ? void 0 : _a.addQueueMeasurement(PerformanceEvents.RegionDiscoveryDetectRegion, this.correlationId);
            // Initialize auto detected region with the region from the envrionment
            let autodetectedRegionName = environmentRegion;
            // Check if a region was detected from the environment, if not, attempt to get the region from IMDS
            if (!autodetectedRegionName) {
                const options = RegionDiscovery.IMDS_OPTIONS;
                try {
                    const localIMDSVersionResponse = yield invokeAsync(this.getRegionFromIMDS.bind(this), PerformanceEvents.RegionDiscoveryGetRegionFromIMDS, this.logger, this.performanceClient, this.correlationId)(Constants.IMDS_VERSION, options);
                    if (localIMDSVersionResponse.status ===
                        ResponseCodes.httpSuccess) {
                        autodetectedRegionName = localIMDSVersionResponse.body;
                        regionDiscoveryMetadata.region_source =
                            RegionDiscoverySources.IMDS;
                    }
                    // If the response using the local IMDS version failed, try to fetch the current version of IMDS and retry.
                    if (localIMDSVersionResponse.status ===
                        ResponseCodes.httpBadRequest) {
                        const currentIMDSVersion = yield invokeAsync(this.getCurrentVersion.bind(this), PerformanceEvents.RegionDiscoveryGetCurrentVersion, this.logger, this.performanceClient, this.correlationId)(options);
                        if (!currentIMDSVersion) {
                            regionDiscoveryMetadata.region_source =
                                RegionDiscoverySources.FAILED_AUTO_DETECTION;
                            return null;
                        }
                        const currentIMDSVersionResponse = yield invokeAsync(this.getRegionFromIMDS.bind(this), PerformanceEvents.RegionDiscoveryGetRegionFromIMDS, this.logger, this.performanceClient, this.correlationId)(currentIMDSVersion, options);
                        if (currentIMDSVersionResponse.status ===
                            ResponseCodes.httpSuccess) {
                            autodetectedRegionName =
                                currentIMDSVersionResponse.body;
                            regionDiscoveryMetadata.region_source =
                                RegionDiscoverySources.IMDS;
                        }
                    }
                }
                catch (e) {
                    regionDiscoveryMetadata.region_source =
                        RegionDiscoverySources.FAILED_AUTO_DETECTION;
                    return null;
                }
            }
            else {
                regionDiscoveryMetadata.region_source =
                    RegionDiscoverySources.ENVIRONMENT_VARIABLE;
            }
            // If no region was auto detected from the environment or from the IMDS endpoint, mark the attempt as a FAILED_AUTO_DETECTION
            if (!autodetectedRegionName) {
                regionDiscoveryMetadata.region_source =
                    RegionDiscoverySources.FAILED_AUTO_DETECTION;
            }
            return autodetectedRegionName || null;
        });
    }
    /**
     * Make the call to the IMDS endpoint
     *
     * @param imdsEndpointUrl
     * @returns Promise<NetworkResponse<string>>
     */
    getRegionFromIMDS(version, options) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            (_a = this.performanceClient) === null || _a === void 0 ? void 0 : _a.addQueueMeasurement(PerformanceEvents.RegionDiscoveryGetRegionFromIMDS, this.correlationId);
            return this.networkInterface.sendGetRequestAsync(`${Constants.IMDS_ENDPOINT}?api-version=${version}&format=text`, options, Constants.IMDS_TIMEOUT);
        });
    }
    /**
     * Get the most recent version of the IMDS endpoint available
     *
     * @returns Promise<string | null>
     */
    getCurrentVersion(options) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            (_a = this.performanceClient) === null || _a === void 0 ? void 0 : _a.addQueueMeasurement(PerformanceEvents.RegionDiscoveryGetCurrentVersion, this.correlationId);
            try {
                const response = yield this.networkInterface.sendGetRequestAsync(`${Constants.IMDS_ENDPOINT}?format=json`, options);
                // When IMDS endpoint is called without the api version query param, bad request response comes back with latest version.
                if (response.status === ResponseCodes.httpBadRequest &&
                    response.body &&
                    response.body["newest-versions"] &&
                    response.body["newest-versions"].length > 0) {
                    return response.body["newest-versions"][0];
                }
                return null;
            }
            catch (e) {
                return null;
            }
        });
    }
}
// Options for the IMDS endpoint request
RegionDiscovery.IMDS_OPTIONS = {
    headers: {
        Metadata: "true",
    },
};

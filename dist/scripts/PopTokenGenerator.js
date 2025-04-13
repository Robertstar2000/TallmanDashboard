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
import * as TimeUtils from "../utils/TimeUtils.js";
import { UrlString } from "../url/UrlString.js";
import { PerformanceEvents } from "../telemetry/performance/PerformanceEvent.js";
import { invokeAsync } from "../utils/FunctionWrappers.js";
const KeyLocation = {
    SW: "sw",
    UHW: "uhw",
};
/** @internal */
export class PopTokenGenerator {
    constructor(cryptoUtils, performanceClient) {
        this.cryptoUtils = cryptoUtils;
        this.performanceClient = performanceClient;
    }
    /**
     * Generates the req_cnf validated at the RP in the POP protocol for SHR parameters
     * and returns an object containing the keyid, the full req_cnf string and the req_cnf string hash
     * @param request
     * @returns
     */
    generateCnf(request, logger) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            (_a = this.performanceClient) === null || _a === void 0 ? void 0 : _a.addQueueMeasurement(PerformanceEvents.PopTokenGenerateCnf, request.correlationId);
            const reqCnf = yield invokeAsync(this.generateKid.bind(this), PerformanceEvents.PopTokenGenerateCnf, logger, this.performanceClient, request.correlationId)(request);
            const reqCnfString = this.cryptoUtils.base64UrlEncode(JSON.stringify(reqCnf));
            return {
                kid: reqCnf.kid,
                reqCnfString,
            };
        });
    }
    /**
     * Generates key_id for a SHR token request
     * @param request
     * @returns
     */
    generateKid(request) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            (_a = this.performanceClient) === null || _a === void 0 ? void 0 : _a.addQueueMeasurement(PerformanceEvents.PopTokenGenerateKid, request.correlationId);
            const kidThumbprint = yield this.cryptoUtils.getPublicKeyThumbprint(request);
            return {
                kid: kidThumbprint,
                xms_ksl: KeyLocation.SW,
            };
        });
    }
    /**
     * Signs the POP access_token with the local generated key-pair
     * @param accessToken
     * @param request
     * @returns
     */
    signPopToken(accessToken, keyId, request) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.signPayload(accessToken, keyId, request);
        });
    }
    /**
     * Utility function to generate the signed JWT for an access_token
     * @param payload
     * @param kid
     * @param request
     * @param claims
     * @returns
     */
    signPayload(payload, keyId, request, claims) {
        return __awaiter(this, void 0, void 0, function* () {
            // Deconstruct request to extract SHR parameters
            const { resourceRequestMethod, resourceRequestUri, shrClaims, shrNonce, shrOptions, } = request;
            const resourceUrlString = resourceRequestUri
                ? new UrlString(resourceRequestUri)
                : undefined;
            const resourceUrlComponents = resourceUrlString === null || resourceUrlString === void 0 ? void 0 : resourceUrlString.getUrlComponents();
            return this.cryptoUtils.signJwt(Object.assign({ at: payload, ts: TimeUtils.nowSeconds(), m: resourceRequestMethod === null || resourceRequestMethod === void 0 ? void 0 : resourceRequestMethod.toUpperCase(), u: resourceUrlComponents === null || resourceUrlComponents === void 0 ? void 0 : resourceUrlComponents.HostNameAndPort, nonce: shrNonce || this.cryptoUtils.createNewGuid(), p: resourceUrlComponents === null || resourceUrlComponents === void 0 ? void 0 : resourceUrlComponents.AbsolutePath, q: (resourceUrlComponents === null || resourceUrlComponents === void 0 ? void 0 : resourceUrlComponents.QueryString)
                    ? [[], resourceUrlComponents.QueryString]
                    : undefined, client_claims: shrClaims || undefined }, claims), keyId, shrOptions, request.correlationId);
        });
    }
}

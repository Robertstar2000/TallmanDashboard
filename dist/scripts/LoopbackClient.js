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
import { Constants as CommonConstants, HttpStatus, UrlUtils, } from "@azure/msal-common/node";
import http from "http";
import { NodeAuthError } from "../error/NodeAuthError.js";
import { Constants } from "../utils/Constants.js";
export class LoopbackClient {
    /**
     * Spins up a loopback server which returns the server response when the localhost redirectUri is hit
     * @param successTemplate
     * @param errorTemplate
     * @returns
     */
    listenForAuthCode(successTemplate, errorTemplate) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.server) {
                throw NodeAuthError.createLoopbackServerAlreadyExistsError();
            }
            return new Promise((resolve, reject) => {
                this.server = http.createServer((req, res) => {
                    const url = req.url;
                    if (!url) {
                        res.end(errorTemplate ||
                            "Error occurred loading redirectUrl");
                        reject(NodeAuthError.createUnableToLoadRedirectUrlError());
                        return;
                    }
                    else if (url === CommonConstants.FORWARD_SLASH) {
                        res.end(successTemplate ||
                            "Auth code was successfully acquired. You can close this window now.");
                        return;
                    }
                    const redirectUri = this.getRedirectUri();
                    const parsedUrl = new URL(url, redirectUri);
                    const authCodeResponse = UrlUtils.getDeserializedResponse(parsedUrl.search) ||
                        {};
                    if (authCodeResponse.code) {
                        res.writeHead(HttpStatus.REDIRECT, {
                            location: redirectUri,
                        }); // Prevent auth code from being saved in the browser history
                        res.end();
                    }
                    if (authCodeResponse.error) {
                        res.end(errorTemplate ||
                            `Error occurred: ${authCodeResponse.error}`);
                    }
                    resolve(authCodeResponse);
                });
                this.server.listen(0, "127.0.0.1"); // Listen on any available port
            });
        });
    }
    /**
     * Get the port that the loopback server is running on
     * @returns
     */
    getRedirectUri() {
        if (!this.server || !this.server.listening) {
            throw NodeAuthError.createNoLoopbackServerExistsError();
        }
        const address = this.server.address();
        if (!address || typeof address === "string" || !address.port) {
            this.closeServer();
            throw NodeAuthError.createInvalidLoopbackAddressTypeError();
        }
        const port = address && address.port;
        return `${Constants.HTTP_PROTOCOL}${Constants.LOCALHOST}:${port}`;
    }
    /**
     * Close the loopback server
     */
    closeServer() {
        if (this.server) {
            // Only stops accepting new connections, server will close once open/idle connections are closed.
            this.server.close();
            if (typeof this.server.closeAllConnections === "function") {
                /*
                 * Close open/idle connections. This API is available in Node versions 18.2 and higher
                 */
                this.server.closeAllConnections();
            }
            this.server.unref();
            this.server = undefined;
        }
    }
}

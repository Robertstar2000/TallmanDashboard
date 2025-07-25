/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
export class NavigationClient {
    /**
     * Navigates to other pages within the same web application
     * @param url
     * @param options
     */
    navigateInternal(url, options) {
        return NavigationClient.defaultNavigateWindow(url, options);
    }
    /**
     * Navigates to other pages outside the web application i.e. the Identity Provider
     * @param url
     * @param options
     */
    navigateExternal(url, options) {
        return NavigationClient.defaultNavigateWindow(url, options);
    }
    /**
     * Default navigation implementation invoked by the internal and external functions
     * @param url
     * @param options
     */
    static defaultNavigateWindow(url, options) {
        if (options.noHistory) {
            window.location.replace(url);
        }
        else {
            window.location.assign(url);
        }
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(true);
            }, options.timeout);
        });
    }
}

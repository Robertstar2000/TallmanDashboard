/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
/**
 * This file is the entrypoint when importing with the browser subpath e.g. "import { someExport } from @azure/msal-common/browser"
 *  Additional exports should be added to the applicable exports-*.ts files
 */
export * from "./exports-common.js";
export * from "./exports-browser-only.js";

// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.
import { notImplemented } from "../_utils.ts";
export { timingSafeEqual } from "./_timingSafeEqual.ts";
export function getFipsCrypto() {
    notImplemented("crypto.getFipsCrypto");
}
export function setFipsCrypto(_fips) {
    notImplemented("crypto.setFipsCrypto");
}

// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// A module to print ANSI terminal colors. Inspired by chalk, kleur, and colors
// on npm.
/**
 * String formatters and utilities for dealing with ANSI color codes.
 *
 * This module is browser compatible.
 *
 * This module supports `NO_COLOR` environmental variable disabling any coloring
 * if `NO_COLOR` is set.
 *
 * @example
 * ```typescript
 * import {
 *   bgBlue,
 *   bgRgb24,
 *   bgRgb8,
 *   bold,
 *   italic,
 *   red,
 *   rgb24,
 *   rgb8,
 * } from "https://deno.land/std@$STD_VERSION/fmt/colors.ts";
 *
 * console.log(bgBlue(italic(red(bold("Hello, World!")))));
 *
 * // also supports 8bit colors
 *
 * console.log(rgb8("Hello, World!", 42));
 *
 * console.log(bgRgb8("Hello, World!", 42));
 *
 * // and 24bit rgb
 *
 * console.log(rgb24("Hello, World!", {
 *   r: 41,
 *   g: 42,
 *   b: 43,
 * }));
 *
 * console.log(bgRgb24("Hello, World!", {
 *   r: 41,
 *   g: 42,
 *   b: 43,
 * }));
 * ```
 *
 * @module
 */
// deno-lint-ignore no-explicit-any
const { Deno } = globalThis;
const noColor = typeof (Deno === null || Deno === void 0 ? void 0 : Deno.noColor) === "boolean"
    ? Deno.noColor
    : true;
let enabled = !noColor;
/**
 * Set changing text color to enabled or disabled
 * @param value
 */
export function setColorEnabled(value) {
    if (noColor) {
        return;
    }
    enabled = value;
}
/** Get whether text color change is enabled or disabled. */
export function getColorEnabled() {
    return enabled;
}
/**
 * Builds color code
 * @param open
 * @param close
 */
function code(open, close) {
    return {
        open: `\x1b[${open.join(";")}m`,
        close: `\x1b[${close}m`,
        regexp: new RegExp(`\\x1b\\[${close}m`, "g"),
    };
}
/**
 * Applies color and background based on color code and its associated text
 * @param str text to apply color settings to
 * @param code color code to apply
 */
function run(str, code) {
    return enabled
        ? `${code.open}${str.replace(code.regexp, code.open)}${code.close}`
        : str;
}
/**
 * Reset the text modified
 * @param str text to reset
 */
export function reset(str) {
    return run(str, code([0], 0));
}
/**
 * Make the text bold.
 * @param str text to make bold
 */
export function bold(str) {
    return run(str, code([1], 22));
}
/**
 * The text emits only a small amount of light.
 * @param str text to dim
 */
export function dim(str) {
    return run(str, code([2], 22));
}
/**
 * Make the text italic.
 * @param str text to make italic
 */
export function italic(str) {
    return run(str, code([3], 23));
}
/**
 * Make the text underline.
 * @param str text to underline
 */
export function underline(str) {
    return run(str, code([4], 24));
}
/**
 * Invert background color and text color.
 * @param str text to invert its color
 */
export function inverse(str) {
    return run(str, code([7], 27));
}
/**
 * Make the text hidden.
 * @param str text to hide
 */
export function hidden(str) {
    return run(str, code([8], 28));
}
/**
 * Put horizontal line through the center of the text.
 * @param str text to strike through
 */
export function strikethrough(str) {
    return run(str, code([9], 29));
}
/**
 * Set text color to black.
 * @param str text to make black
 */
export function black(str) {
    return run(str, code([30], 39));
}
/**
 * Set text color to red.
 * @param str text to make red
 */
export function red(str) {
    return run(str, code([31], 39));
}
/**
 * Set text color to green.
 * @param str text to make green
 */
export function green(str) {
    return run(str, code([32], 39));
}
/**
 * Set text color to yellow.
 * @param str text to make yellow
 */
export function yellow(str) {
    return run(str, code([33], 39));
}
/**
 * Set text color to blue.
 * @param str text to make blue
 */
export function blue(str) {
    return run(str, code([34], 39));
}
/**
 * Set text color to magenta.
 * @param str text to make magenta
 */
export function magenta(str) {
    return run(str, code([35], 39));
}
/**
 * Set text color to cyan.
 * @param str text to make cyan
 */
export function cyan(str) {
    return run(str, code([36], 39));
}
/**
 * Set text color to white.
 * @param str text to make white
 */
export function white(str) {
    return run(str, code([37], 39));
}
/**
 * Set text color to gray.
 * @param str text to make gray
 */
export function gray(str) {
    return brightBlack(str);
}
/**
 * Set text color to bright black.
 * @param str text to make bright-black
 */
export function brightBlack(str) {
    return run(str, code([90], 39));
}
/**
 * Set text color to bright red.
 * @param str text to make bright-red
 */
export function brightRed(str) {
    return run(str, code([91], 39));
}
/**
 * Set text color to bright green.
 * @param str text to make bright-green
 */
export function brightGreen(str) {
    return run(str, code([92], 39));
}
/**
 * Set text color to bright yellow.
 * @param str text to make bright-yellow
 */
export function brightYellow(str) {
    return run(str, code([93], 39));
}
/**
 * Set text color to bright blue.
 * @param str text to make bright-blue
 */
export function brightBlue(str) {
    return run(str, code([94], 39));
}
/**
 * Set text color to bright magenta.
 * @param str text to make bright-magenta
 */
export function brightMagenta(str) {
    return run(str, code([95], 39));
}
/**
 * Set text color to bright cyan.
 * @param str text to make bright-cyan
 */
export function brightCyan(str) {
    return run(str, code([96], 39));
}
/**
 * Set text color to bright white.
 * @param str text to make bright-white
 */
export function brightWhite(str) {
    return run(str, code([97], 39));
}
/**
 * Set background color to black.
 * @param str text to make its background black
 */
export function bgBlack(str) {
    return run(str, code([40], 49));
}
/**
 * Set background color to red.
 * @param str text to make its background red
 */
export function bgRed(str) {
    return run(str, code([41], 49));
}
/**
 * Set background color to green.
 * @param str text to make its background green
 */
export function bgGreen(str) {
    return run(str, code([42], 49));
}
/**
 * Set background color to yellow.
 * @param str text to make its background yellow
 */
export function bgYellow(str) {
    return run(str, code([43], 49));
}
/**
 * Set background color to blue.
 * @param str text to make its background blue
 */
export function bgBlue(str) {
    return run(str, code([44], 49));
}
/**
 *  Set background color to magenta.
 * @param str text to make its background magenta
 */
export function bgMagenta(str) {
    return run(str, code([45], 49));
}
/**
 * Set background color to cyan.
 * @param str text to make its background cyan
 */
export function bgCyan(str) {
    return run(str, code([46], 49));
}
/**
 * Set background color to white.
 * @param str text to make its background white
 */
export function bgWhite(str) {
    return run(str, code([47], 49));
}
/**
 * Set background color to bright black.
 * @param str text to make its background bright-black
 */
export function bgBrightBlack(str) {
    return run(str, code([100], 49));
}
/**
 * Set background color to bright red.
 * @param str text to make its background bright-red
 */
export function bgBrightRed(str) {
    return run(str, code([101], 49));
}
/**
 * Set background color to bright green.
 * @param str text to make its background bright-green
 */
export function bgBrightGreen(str) {
    return run(str, code([102], 49));
}
/**
 * Set background color to bright yellow.
 * @param str text to make its background bright-yellow
 */
export function bgBrightYellow(str) {
    return run(str, code([103], 49));
}
/**
 * Set background color to bright blue.
 * @param str text to make its background bright-blue
 */
export function bgBrightBlue(str) {
    return run(str, code([104], 49));
}
/**
 * Set background color to bright magenta.
 * @param str text to make its background bright-magenta
 */
export function bgBrightMagenta(str) {
    return run(str, code([105], 49));
}
/**
 * Set background color to bright cyan.
 * @param str text to make its background bright-cyan
 */
export function bgBrightCyan(str) {
    return run(str, code([106], 49));
}
/**
 * Set background color to bright white.
 * @param str text to make its background bright-white
 */
export function bgBrightWhite(str) {
    return run(str, code([107], 49));
}
/* Special Color Sequences */
/**
 * Clam and truncate color codes
 * @param n
 * @param max number to truncate to
 * @param min number to truncate from
 */
function clampAndTruncate(n, max = 255, min = 0) {
    return Math.trunc(Math.max(Math.min(n, max), min));
}
/**
 * Set text color using paletted 8bit colors.
 * https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit
 * @param str text color to apply paletted 8bit colors to
 * @param color code
 */
export function rgb8(str, color) {
    return run(str, code([38, 5, clampAndTruncate(color)], 39));
}
/**
 * Set background color using paletted 8bit colors.
 * https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit
 * @param str text color to apply paletted 8bit background colors to
 * @param color code
 */
export function bgRgb8(str, color) {
    return run(str, code([48, 5, clampAndTruncate(color)], 49));
}
/**
 * Set text color using 24bit rgb.
 * `color` can be a number in range `0x000000` to `0xffffff` or
 * an `Rgb`.
 *
 * To produce the color magenta:
 *
 * ```ts
 *      import { rgb24 } from "https://deno.land/std@$STD_VERSION/fmt/colors.ts";
 *      rgb24("foo", 0xff00ff);
 *      rgb24("foo", {r: 255, g: 0, b: 255});
 * ```
 * @param str text color to apply 24bit rgb to
 * @param color code
 */
export function rgb24(str, color) {
    if (typeof color === "number") {
        return run(str, code([38, 2, (color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff], 39));
    }
    return run(str, code([
        38,
        2,
        clampAndTruncate(color.r),
        clampAndTruncate(color.g),
        clampAndTruncate(color.b),
    ], 39));
}
/**
 * Set background color using 24bit rgb.
 * `color` can be a number in range `0x000000` to `0xffffff` or
 * an `Rgb`.
 *
 * To produce the color magenta:
 *
 * ```ts
 *      import { bgRgb24 } from "https://deno.land/std@$STD_VERSION/fmt/colors.ts";
 *      bgRgb24("foo", 0xff00ff);
 *      bgRgb24("foo", {r: 255, g: 0, b: 255});
 * ```
 * @param str text color to apply 24bit rgb to
 * @param color code
 */
export function bgRgb24(str, color) {
    if (typeof color === "number") {
        return run(str, code([48, 2, (color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff], 49));
    }
    return run(str, code([
        48,
        2,
        clampAndTruncate(color.r),
        clampAndTruncate(color.g),
        clampAndTruncate(color.b),
    ], 49));
}
// https://github.com/chalk/ansi-regex/blob/02fa893d619d3da85411acc8fd4e2eea0e95a9d9/index.js
const ANSI_PATTERN = new RegExp([
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))",
].join("|"), "g");
/**
 * Remove ANSI escape codes from the string.
 * @param string to remove ANSI escape codes from
 */
export function stripColor(string) {
    return string.replace(ANSI_PATTERN, "");
}

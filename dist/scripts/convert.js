/**
 * convert
 */
import { CacheItem, NullObject, createCacheKey, getCache, setCache } from './cache';
import { convertColorToHsl, convertColorToHwb, convertColorToLab, convertColorToLch, convertColorToOklab, convertColorToOklch, convertColorToRgb, numberToHexString, parseColorFunc, parseColorValue } from './color';
import { isString } from './common';
import { cssCalc } from './css-calc';
import { resolveVar } from './css-var';
import { resolveRelativeColor } from './relative-color';
import { resolveColor } from './resolve';
/* constants */
import { SYN_FN_CALC, SYN_FN_REL, SYN_FN_VAR, VAL_COMP } from './constant';
const NAMESPACE = 'convert';
/* regexp */
const REG_FN_CALC = new RegExp(SYN_FN_CALC);
const REG_FN_REL = new RegExp(SYN_FN_REL);
const REG_FN_VAR = new RegExp(SYN_FN_VAR);
/**
 * pre process
 * @param value - CSS color value
 * @param [opt] - options
 * @returns value
 */
export const preProcess = (value, opt = {}) => {
    if (isString(value)) {
        value = value.trim();
        if (!value) {
            return new NullObject();
        }
    }
    else {
        return new NullObject();
    }
    const cacheKey = createCacheKey({
        namespace: NAMESPACE,
        name: 'preProcess',
        value
    }, opt);
    const cachedResult = getCache(cacheKey);
    if (cachedResult instanceof CacheItem) {
        if (cachedResult.isNull) {
            return cachedResult;
        }
        return cachedResult.item;
    }
    if (REG_FN_VAR.test(value)) {
        const resolvedValue = resolveVar(value, opt);
        if (isString(resolvedValue)) {
            value = resolvedValue;
        }
        else {
            setCache(cacheKey, null);
            return new NullObject();
        }
    }
    if (REG_FN_REL.test(value)) {
        const resolvedValue = resolveRelativeColor(value, opt);
        if (isString(resolvedValue)) {
            value = resolvedValue;
        }
        else {
            setCache(cacheKey, null);
            return new NullObject();
        }
    }
    else if (REG_FN_CALC.test(value)) {
        value = cssCalc(value, opt);
    }
    if (value.startsWith('color-mix')) {
        const clonedOpt = structuredClone(opt);
        clonedOpt.format = VAL_COMP;
        clonedOpt.nullable = true;
        const resolvedValue = resolveColor(value, clonedOpt);
        setCache(cacheKey, resolvedValue);
        return resolvedValue;
    }
    setCache(cacheKey, value);
    return value;
};
/**
 * convert number to hex string
 * @param value - numeric value
 * @returns hex string: 00..ff
 */
export const numberToHex = (value) => {
    const hex = numberToHexString(value);
    return hex;
};
/**
 * convert color to hex
 * @param value - CSS color value
 * @param [opt] - options
 * @param [opt.alpha] - enable alpha channel
 * @returns #rrggbb | #rrggbbaa | null
 */
export const colorToHex = (value, opt = {}) => {
    if (isString(value)) {
        const resolvedValue = preProcess(value, opt);
        if (resolvedValue instanceof NullObject) {
            return null;
        }
        value = resolvedValue.toLowerCase();
    }
    else {
        throw new TypeError(`${value} is not a string.`);
    }
    const { alpha = false } = opt;
    const cacheKey = createCacheKey({
        namespace: NAMESPACE,
        name: 'colorToHex',
        value
    }, opt);
    const cachedResult = getCache(cacheKey);
    if (cachedResult instanceof CacheItem) {
        if (cachedResult.isNull) {
            return null;
        }
        return cachedResult.item;
    }
    let hex;
    opt.nullable = true;
    if (alpha) {
        opt.format = 'hexAlpha';
        hex = resolveColor(value, opt);
    }
    else {
        opt.format = 'hex';
        hex = resolveColor(value, opt);
    }
    if (isString(hex)) {
        setCache(cacheKey, hex);
        return hex;
    }
    setCache(cacheKey, null);
    return null;
};
/**
 * convert color to hsl
 * @param value - CSS color value
 * @param [opt] - options
 * @returns ColorChannels - [h, s, l, alpha]
 */
export const colorToHsl = (value, opt = {}) => {
    if (isString(value)) {
        const resolvedValue = preProcess(value, opt);
        if (resolvedValue instanceof NullObject) {
            return [0, 0, 0, 0];
        }
        value = resolvedValue.toLowerCase();
    }
    else {
        throw new TypeError(`${value} is not a string.`);
    }
    const cacheKey = createCacheKey({
        namespace: NAMESPACE,
        name: 'colorToHsl',
        value
    }, opt);
    const cachedResult = getCache(cacheKey);
    if (cachedResult instanceof CacheItem) {
        return cachedResult.item;
    }
    opt.format = 'hsl';
    const hsl = convertColorToHsl(value, opt);
    setCache(cacheKey, hsl);
    return hsl;
};
/**
 * convert color to hwb
 * @param value - CSS color value
 * @param [opt] - options
 * @returns ColorChannels - [h, w, b, alpha]
 */
export const colorToHwb = (value, opt = {}) => {
    if (isString(value)) {
        const resolvedValue = preProcess(value, opt);
        if (resolvedValue instanceof NullObject) {
            return [0, 0, 0, 0];
        }
        value = resolvedValue.toLowerCase();
    }
    else {
        throw new TypeError(`${value} is not a string.`);
    }
    const cacheKey = createCacheKey({
        namespace: NAMESPACE,
        name: 'colorToHwb',
        value
    }, opt);
    const cachedResult = getCache(cacheKey);
    if (cachedResult instanceof CacheItem) {
        return cachedResult.item;
    }
    opt.format = 'hwb';
    const hwb = convertColorToHwb(value, opt);
    setCache(cacheKey, hwb);
    return hwb;
};
/**
 * convert color to lab
 * @param value - CSS color value
 * @param [opt] - options
 * @returns ColorChannels - [l, a, b, alpha]
 */
export const colorToLab = (value, opt = {}) => {
    if (isString(value)) {
        const resolvedValue = preProcess(value, opt);
        if (resolvedValue instanceof NullObject) {
            return [0, 0, 0, 0];
        }
        value = resolvedValue.toLowerCase();
    }
    else {
        throw new TypeError(`${value} is not a string.`);
    }
    const cacheKey = createCacheKey({
        namespace: NAMESPACE,
        name: 'colorToLab',
        value
    }, opt);
    const cachedResult = getCache(cacheKey);
    if (cachedResult instanceof CacheItem) {
        return cachedResult.item;
    }
    const lab = convertColorToLab(value, opt);
    setCache(cacheKey, lab);
    return lab;
};
/**
 * convert color to lch
 * @param value - CSS color value
 * @param [opt] - options
 * @returns ColorChannels - [l, c, h, alpha]
 */
export const colorToLch = (value, opt = {}) => {
    if (isString(value)) {
        const resolvedValue = preProcess(value, opt);
        if (resolvedValue instanceof NullObject) {
            return [0, 0, 0, 0];
        }
        value = resolvedValue.toLowerCase();
    }
    else {
        throw new TypeError(`${value} is not a string.`);
    }
    const cacheKey = createCacheKey({
        namespace: NAMESPACE,
        name: 'colorToLch',
        value
    }, opt);
    const cachedResult = getCache(cacheKey);
    if (cachedResult instanceof CacheItem) {
        return cachedResult.item;
    }
    const lch = convertColorToLch(value, opt);
    setCache(cacheKey, lch);
    return lch;
};
/**
 * convert color to oklab
 * @param value - CSS color value
 * @param [opt] - options
 * @returns ColorChannels - [l, a, b, alpha]
 */
export const colorToOklab = (value, opt = {}) => {
    if (isString(value)) {
        const resolvedValue = preProcess(value, opt);
        if (resolvedValue instanceof NullObject) {
            return [0, 0, 0, 0];
        }
        value = resolvedValue.toLowerCase();
    }
    else {
        throw new TypeError(`${value} is not a string.`);
    }
    const cacheKey = createCacheKey({
        namespace: NAMESPACE,
        name: 'colorToOklab',
        value
    }, opt);
    const cachedResult = getCache(cacheKey);
    if (cachedResult instanceof CacheItem) {
        return cachedResult.item;
    }
    const lab = convertColorToOklab(value, opt);
    setCache(cacheKey, lab);
    return lab;
};
/**
 * convert color to oklch
 * @param value - CSS color value
 * @param [opt] - options
 * @returns ColorChannels - [l, c, h, alpha]
 */
export const colorToOklch = (value, opt = {}) => {
    if (isString(value)) {
        const resolvedValue = preProcess(value, opt);
        if (resolvedValue instanceof NullObject) {
            return [0, 0, 0, 0];
        }
        value = resolvedValue.toLowerCase();
    }
    else {
        throw new TypeError(`${value} is not a string.`);
    }
    const cacheKey = createCacheKey({
        namespace: NAMESPACE,
        name: 'colorToOklch',
        value
    }, opt);
    const cachedResult = getCache(cacheKey);
    if (cachedResult instanceof CacheItem) {
        return cachedResult.item;
    }
    const lch = convertColorToOklch(value, opt);
    setCache(cacheKey, lch);
    return lch;
};
/**
 * convert color to rgb
 * @param value - CSS color value
 * @param [opt] - options
 * @returns ColorChannels - [r, g, b, alpha]
 */
export const colorToRgb = (value, opt = {}) => {
    if (isString(value)) {
        const resolvedValue = preProcess(value, opt);
        if (resolvedValue instanceof NullObject) {
            return [0, 0, 0, 0];
        }
        value = resolvedValue.toLowerCase();
    }
    else {
        throw new TypeError(`${value} is not a string.`);
    }
    const cacheKey = createCacheKey({
        namespace: NAMESPACE,
        name: 'colorToRgb',
        value
    }, opt);
    const cachedResult = getCache(cacheKey);
    if (cachedResult instanceof CacheItem) {
        return cachedResult.item;
    }
    const rgb = convertColorToRgb(value, opt);
    setCache(cacheKey, rgb);
    return rgb;
};
/**
 * convert color to xyz
 * @param value - CSS color value
 * @param [opt] - options
 * @returns ColorChannels - [x, y, z, alpha]
 */
export const colorToXyz = (value, opt = {}) => {
    if (isString(value)) {
        const resolvedValue = preProcess(value, opt);
        if (resolvedValue instanceof NullObject) {
            return [0, 0, 0, 0];
        }
        value = resolvedValue.toLowerCase();
    }
    else {
        throw new TypeError(`${value} is not a string.`);
    }
    const cacheKey = createCacheKey({
        namespace: NAMESPACE,
        name: 'colorToXyz',
        value
    }, opt);
    const cachedResult = getCache(cacheKey);
    if (cachedResult instanceof CacheItem) {
        return cachedResult.item;
    }
    let xyz;
    if (value.startsWith('color(')) {
        [, ...xyz] = parseColorFunc(value, opt);
    }
    else {
        [, ...xyz] = parseColorValue(value, opt);
    }
    setCache(cacheKey, xyz);
    return xyz;
};
/**
 * convert color to xyz-d50
 * @param value - CSS color value
 * @param [opt] - options
 * @returns ColorChannels - [x, y, z, alpha]
 */
export const colorToXyzD50 = (value, opt = {}) => {
    opt.d50 = true;
    return colorToXyz(value, opt);
};
/* convert */
export const convert = {
    colorToHex,
    colorToHsl,
    colorToHwb,
    colorToLab,
    colorToLch,
    colorToOklab,
    colorToOklch,
    colorToRgb,
    colorToXyz,
    colorToXyzD50,
    numberToHex
};

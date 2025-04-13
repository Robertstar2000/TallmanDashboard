/**
 * css-calc
 */
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Calculator_hasNum, _Calculator_numSum, _Calculator_numMul, _Calculator_hasPct, _Calculator_pctSum, _Calculator_pctMul, _Calculator_hasDim, _Calculator_dimSum, _Calculator_dimSub, _Calculator_dimMul, _Calculator_dimDiv, _Calculator_hasEtc, _Calculator_etcSum, _Calculator_etcSub, _Calculator_etcMul, _Calculator_etcDiv;
import { calc } from '@csstools/css-calc';
import { TokenType, tokenize } from '@csstools/css-tokenizer';
import { CacheItem, NullObject, createCacheKey, getCache, setCache } from './cache';
import { isString, isStringOrNumber } from './common';
import { resolveVar } from './css-var';
import { roundToPrecision } from './util';
/* constants */
import { ANGLE, LENGTH, NUM, SYN_FN_CALC, SYN_FN_MATH_START, SYN_FN_VAR, SYN_FN_VAR_START, VAL_SPEC } from './constant';
const { CloseParen: PAREN_CLOSE, Comment: COMMENT, Dimension: DIM, EOF, Function: FUNC, OpenParen: PAREN_OPEN, Whitespace: W_SPACE } = TokenType;
const NAMESPACE = 'css-calc';
/* numeric constants */
const TRIA = 3;
const HEX = 16;
const MAX_PCT = 100;
/* regexp */
const REG_FN_CALC = new RegExp(SYN_FN_CALC);
const REG_FN_MATH_START = new RegExp(SYN_FN_MATH_START);
const REG_FN_VAR = new RegExp(SYN_FN_VAR);
const REG_FN_VAR_START = new RegExp(SYN_FN_VAR_START);
const REG_OPERATOR = /\s[*+/-]\s/;
const REG_TYPE_DIM = new RegExp(`^(${NUM})(${ANGLE}|${LENGTH})$`);
const REG_TYPE_DIM_PCT = new RegExp(`^(${NUM})(${ANGLE}|${LENGTH}|%)$`);
const REG_TYPE_PCT = new RegExp(`^(${NUM})%$`);
/**
 * Calclator
 */
export class Calculator {
    /**
     * constructor
     */
    constructor() {
        /* private */
        // number
        _Calculator_hasNum.set(this, void 0);
        _Calculator_numSum.set(this, void 0);
        _Calculator_numMul.set(this, void 0);
        // percentage
        _Calculator_hasPct.set(this, void 0);
        _Calculator_pctSum.set(this, void 0);
        _Calculator_pctMul.set(this, void 0);
        // dimension
        _Calculator_hasDim.set(this, void 0);
        _Calculator_dimSum.set(this, void 0);
        _Calculator_dimSub.set(this, void 0);
        _Calculator_dimMul.set(this, void 0);
        _Calculator_dimDiv.set(this, void 0);
        // et cetra
        _Calculator_hasEtc.set(this, void 0);
        _Calculator_etcSum.set(this, void 0);
        _Calculator_etcSub.set(this, void 0);
        _Calculator_etcMul.set(this, void 0);
        _Calculator_etcDiv.set(this, void 0);
        // number
        __classPrivateFieldSet(this, _Calculator_hasNum, false, "f");
        __classPrivateFieldSet(this, _Calculator_numSum, [], "f");
        __classPrivateFieldSet(this, _Calculator_numMul, [], "f");
        // percentage
        __classPrivateFieldSet(this, _Calculator_hasPct, false, "f");
        __classPrivateFieldSet(this, _Calculator_pctSum, [], "f");
        __classPrivateFieldSet(this, _Calculator_pctMul, [], "f");
        // dimension
        __classPrivateFieldSet(this, _Calculator_hasDim, false, "f");
        __classPrivateFieldSet(this, _Calculator_dimSum, [], "f");
        __classPrivateFieldSet(this, _Calculator_dimSub, [], "f");
        __classPrivateFieldSet(this, _Calculator_dimMul, [], "f");
        __classPrivateFieldSet(this, _Calculator_dimDiv, [], "f");
        // et cetra
        __classPrivateFieldSet(this, _Calculator_hasEtc, false, "f");
        __classPrivateFieldSet(this, _Calculator_etcSum, [], "f");
        __classPrivateFieldSet(this, _Calculator_etcSub, [], "f");
        __classPrivateFieldSet(this, _Calculator_etcMul, [], "f");
        __classPrivateFieldSet(this, _Calculator_etcDiv, [], "f");
    }
    get hasNum() {
        return __classPrivateFieldGet(this, _Calculator_hasNum, "f");
    }
    set hasNum(value) {
        __classPrivateFieldSet(this, _Calculator_hasNum, !!value, "f");
    }
    get numSum() {
        return __classPrivateFieldGet(this, _Calculator_numSum, "f");
    }
    get numMul() {
        return __classPrivateFieldGet(this, _Calculator_numMul, "f");
    }
    get hasPct() {
        return __classPrivateFieldGet(this, _Calculator_hasPct, "f");
    }
    set hasPct(value) {
        __classPrivateFieldSet(this, _Calculator_hasPct, !!value, "f");
    }
    get pctSum() {
        return __classPrivateFieldGet(this, _Calculator_pctSum, "f");
    }
    get pctMul() {
        return __classPrivateFieldGet(this, _Calculator_pctMul, "f");
    }
    get hasDim() {
        return __classPrivateFieldGet(this, _Calculator_hasDim, "f");
    }
    set hasDim(value) {
        __classPrivateFieldSet(this, _Calculator_hasDim, !!value, "f");
    }
    get dimSum() {
        return __classPrivateFieldGet(this, _Calculator_dimSum, "f");
    }
    get dimSub() {
        return __classPrivateFieldGet(this, _Calculator_dimSub, "f");
    }
    get dimMul() {
        return __classPrivateFieldGet(this, _Calculator_dimMul, "f");
    }
    get dimDiv() {
        return __classPrivateFieldGet(this, _Calculator_dimDiv, "f");
    }
    get hasEtc() {
        return __classPrivateFieldGet(this, _Calculator_hasEtc, "f");
    }
    set hasEtc(value) {
        __classPrivateFieldSet(this, _Calculator_hasEtc, !!value, "f");
    }
    get etcSum() {
        return __classPrivateFieldGet(this, _Calculator_etcSum, "f");
    }
    get etcSub() {
        return __classPrivateFieldGet(this, _Calculator_etcSub, "f");
    }
    get etcMul() {
        return __classPrivateFieldGet(this, _Calculator_etcMul, "f");
    }
    get etcDiv() {
        return __classPrivateFieldGet(this, _Calculator_etcDiv, "f");
    }
    /**
     * clear values
     * @returns void
     */
    clear() {
        // number
        __classPrivateFieldSet(this, _Calculator_hasNum, false, "f");
        __classPrivateFieldSet(this, _Calculator_numSum, [], "f");
        __classPrivateFieldSet(this, _Calculator_numMul, [], "f");
        // percentage
        __classPrivateFieldSet(this, _Calculator_hasPct, false, "f");
        __classPrivateFieldSet(this, _Calculator_pctSum, [], "f");
        __classPrivateFieldSet(this, _Calculator_pctMul, [], "f");
        // dimension
        __classPrivateFieldSet(this, _Calculator_hasDim, false, "f");
        __classPrivateFieldSet(this, _Calculator_dimSum, [], "f");
        __classPrivateFieldSet(this, _Calculator_dimSub, [], "f");
        __classPrivateFieldSet(this, _Calculator_dimMul, [], "f");
        __classPrivateFieldSet(this, _Calculator_dimDiv, [], "f");
        // et cetra
        __classPrivateFieldSet(this, _Calculator_hasEtc, false, "f");
        __classPrivateFieldSet(this, _Calculator_etcSum, [], "f");
        __classPrivateFieldSet(this, _Calculator_etcSub, [], "f");
        __classPrivateFieldSet(this, _Calculator_etcMul, [], "f");
        __classPrivateFieldSet(this, _Calculator_etcDiv, [], "f");
    }
    /**
     * sort values
     * @param values - values
     * @returns sorted values
     */
    sort(values = []) {
        const arr = [...values];
        if (arr.length > 1) {
            arr.sort((a, b) => {
                let res;
                if (REG_TYPE_DIM_PCT.test(a) && REG_TYPE_DIM_PCT.test(b)) {
                    const [, valA, unitA] = a.match(REG_TYPE_DIM_PCT);
                    const [, valB, unitB] = b.match(REG_TYPE_DIM_PCT);
                    if (unitA === unitB) {
                        if (Number(valA) === Number(valB)) {
                            res = 0;
                        }
                        else if (Number(valA) > Number(valB)) {
                            res = 1;
                        }
                        else {
                            res = -1;
                        }
                    }
                    else if (unitA > unitB) {
                        res = 1;
                    }
                    else {
                        res = -1;
                    }
                }
                else {
                    if (a === b) {
                        res = 0;
                    }
                    else if (a > b) {
                        res = 1;
                    }
                    else {
                        res = -1;
                    }
                }
                return res;
            });
        }
        return arr;
    }
    /**
     * multiply values
     * @returns resolved value
     */
    multiply() {
        const value = [];
        let num;
        if (__classPrivateFieldGet(this, _Calculator_hasNum, "f")) {
            num = 1;
            for (const i of __classPrivateFieldGet(this, _Calculator_numMul, "f")) {
                num *= i;
                if (num === 0 || !Number.isFinite(num) || Number.isNaN(num)) {
                    break;
                }
            }
            if (!__classPrivateFieldGet(this, _Calculator_hasPct, "f") && !__classPrivateFieldGet(this, _Calculator_hasDim, "f") && !this.hasEtc) {
                if (Number.isFinite(num)) {
                    num = roundToPrecision(num, HEX);
                }
                value.push(num);
            }
        }
        if (__classPrivateFieldGet(this, _Calculator_hasPct, "f")) {
            if (typeof num !== 'number') {
                num = 1;
            }
            for (const i of __classPrivateFieldGet(this, _Calculator_pctMul, "f")) {
                num *= i;
                if (num === 0 || !Number.isFinite(num) || Number.isNaN(num)) {
                    break;
                }
            }
            if (Number.isFinite(num)) {
                num = `${roundToPrecision(num, HEX)}%`;
            }
            if (!__classPrivateFieldGet(this, _Calculator_hasDim, "f") && !this.hasEtc) {
                value.push(num);
            }
        }
        if (__classPrivateFieldGet(this, _Calculator_hasDim, "f")) {
            let dim = '';
            let mul = '';
            let div = '';
            if (__classPrivateFieldGet(this, _Calculator_dimMul, "f").length) {
                if (__classPrivateFieldGet(this, _Calculator_dimMul, "f").length === 1) {
                    [mul] = __classPrivateFieldGet(this, _Calculator_dimMul, "f");
                }
                else {
                    mul = `${this.sort(__classPrivateFieldGet(this, _Calculator_dimMul, "f")).join(' * ')}`;
                }
            }
            if (__classPrivateFieldGet(this, _Calculator_dimDiv, "f").length) {
                if (__classPrivateFieldGet(this, _Calculator_dimDiv, "f").length === 1) {
                    [div] = __classPrivateFieldGet(this, _Calculator_dimDiv, "f");
                }
                else {
                    div = `${this.sort(__classPrivateFieldGet(this, _Calculator_dimDiv, "f")).join(' * ')}`;
                }
            }
            if (Number.isFinite(num)) {
                if (mul) {
                    if (div) {
                        if (div.includes('*')) {
                            dim = calc(`calc(${num} * ${mul} / (${div}))`, {
                                toCanonicalUnits: true
                            });
                        }
                        else {
                            dim = calc(`calc(${num} * ${mul} / ${div})`, {
                                toCanonicalUnits: true
                            });
                        }
                    }
                    else {
                        dim = calc(`calc(${num} * ${mul})`, {
                            toCanonicalUnits: true
                        });
                    }
                }
                else if (div.includes('*')) {
                    dim = calc(`calc(${num} / (${div}))`, {
                        toCanonicalUnits: true
                    });
                }
                else {
                    dim = calc(`calc(${num} / ${div})`, {
                        toCanonicalUnits: true
                    });
                }
                value.push(dim.replace(/^calc/, ''));
            }
            else {
                if (!value.length && num !== undefined) {
                    value.push(num);
                }
                if (mul) {
                    if (div) {
                        if (div.includes('*')) {
                            dim = calc(`calc(${mul} / (${div}))`, {
                                toCanonicalUnits: true
                            });
                        }
                        else {
                            dim = calc(`calc(${mul} / ${div})`, {
                                toCanonicalUnits: true
                            });
                        }
                    }
                    else {
                        dim = calc(`calc(${mul})`, {
                            toCanonicalUnits: true
                        });
                    }
                    if (value.length) {
                        value.push('*', dim.replace(/^calc/, ''));
                    }
                    else {
                        value.push(dim.replace(/^calc/, ''));
                    }
                }
                else {
                    dim = calc(`calc(${div})`, {
                        toCanonicalUnits: true
                    });
                    if (value.length) {
                        value.push('/', dim.replace(/^calc/, ''));
                    }
                    else {
                        value.push('1', '/', dim.replace(/^calc/, ''));
                    }
                }
            }
        }
        if (__classPrivateFieldGet(this, _Calculator_hasEtc, "f")) {
            if (__classPrivateFieldGet(this, _Calculator_etcMul, "f").length) {
                if (!value.length && num !== undefined) {
                    value.push(num);
                }
                const mul = this.sort(__classPrivateFieldGet(this, _Calculator_etcMul, "f")).join(' * ');
                if (value.length) {
                    value.push(`* ${mul}`);
                }
                else {
                    value.push(`${mul}`);
                }
            }
            if (__classPrivateFieldGet(this, _Calculator_etcDiv, "f").length) {
                const div = this.sort(__classPrivateFieldGet(this, _Calculator_etcDiv, "f")).join(' * ');
                if (div.includes('*')) {
                    if (value.length) {
                        value.push(`/ (${div})`);
                    }
                    else {
                        value.push(`1 / (${div})`);
                    }
                }
                else if (value.length) {
                    value.push(`/ ${div}`);
                }
                else {
                    value.push(`1 / ${div}`);
                }
            }
        }
        if (value.length) {
            return value.join(' ');
        }
        return '';
    }
    /**
     * sum values
     * @returns resolved value
     */
    sum() {
        const value = [];
        if (__classPrivateFieldGet(this, _Calculator_hasNum, "f")) {
            let num = 0;
            for (const i of __classPrivateFieldGet(this, _Calculator_numSum, "f")) {
                num += i;
                if (!Number.isFinite(num) || Number.isNaN(num)) {
                    break;
                }
            }
            value.push(num);
        }
        if (__classPrivateFieldGet(this, _Calculator_hasPct, "f")) {
            let num = 0;
            for (const i of __classPrivateFieldGet(this, _Calculator_pctSum, "f")) {
                num += i;
                if (!Number.isFinite(num)) {
                    break;
                }
            }
            if (Number.isFinite(num)) {
                num = `${num}%`;
            }
            if (value.length) {
                value.push(`+ ${num}`);
            }
            else {
                value.push(num);
            }
        }
        if (__classPrivateFieldGet(this, _Calculator_hasDim, "f")) {
            let dim, sum, sub;
            if (__classPrivateFieldGet(this, _Calculator_dimSum, "f").length) {
                sum = __classPrivateFieldGet(this, _Calculator_dimSum, "f").join(' + ');
            }
            if (__classPrivateFieldGet(this, _Calculator_dimSub, "f").length) {
                sub = __classPrivateFieldGet(this, _Calculator_dimSub, "f").join(' + ');
            }
            if (sum) {
                if (sub) {
                    if (sub.includes('-')) {
                        dim = calc(`calc(${sum} - (${sub}))`, {
                            toCanonicalUnits: true
                        });
                    }
                    else {
                        dim = calc(`calc(${sum} - ${sub})`, {
                            toCanonicalUnits: true
                        });
                    }
                }
                else {
                    dim = calc(`calc(${sum})`, {
                        toCanonicalUnits: true
                    });
                }
            }
            else {
                dim = calc(`calc(-1 * (${sub}))`, {
                    toCanonicalUnits: true
                });
            }
            if (value.length) {
                value.push('+', dim.replace(/^calc/, ''));
            }
            else {
                value.push(dim.replace(/^calc/, ''));
            }
        }
        if (__classPrivateFieldGet(this, _Calculator_hasEtc, "f")) {
            if (__classPrivateFieldGet(this, _Calculator_etcSum, "f").length) {
                const sum = this.sort(__classPrivateFieldGet(this, _Calculator_etcSum, "f"))
                    .map(item => {
                    let res;
                    if (REG_OPERATOR.test(item) &&
                        !item.startsWith('(') &&
                        !item.endsWith(')')) {
                        res = `(${item})`;
                    }
                    else {
                        res = item;
                    }
                    return res;
                })
                    .join(' + ');
                if (value.length) {
                    if (__classPrivateFieldGet(this, _Calculator_etcSum, "f").length > 1) {
                        value.push(`+ (${sum})`);
                    }
                    else {
                        value.push(`+ ${sum}`);
                    }
                }
                else {
                    value.push(`${sum}`);
                }
            }
            if (__classPrivateFieldGet(this, _Calculator_etcSub, "f").length) {
                const sub = this.sort(__classPrivateFieldGet(this, _Calculator_etcSub, "f"))
                    .map(item => {
                    let res;
                    if (REG_OPERATOR.test(item) &&
                        !item.startsWith('(') &&
                        !item.endsWith(')')) {
                        res = `(${item})`;
                    }
                    else {
                        res = item;
                    }
                    return res;
                })
                    .join(' + ');
                if (value.length) {
                    if (__classPrivateFieldGet(this, _Calculator_etcSub, "f").length > 1) {
                        value.push(`- (${sub})`);
                    }
                    else {
                        value.push(`- ${sub}`);
                    }
                }
                else if (__classPrivateFieldGet(this, _Calculator_etcSub, "f").length > 1) {
                    value.push(`-1 * (${sub})`);
                }
                else {
                    value.push(`-1 * ${sub}`);
                }
            }
        }
        if (value.length) {
            return value.join(' ');
        }
        return '';
    }
}
_Calculator_hasNum = new WeakMap(), _Calculator_numSum = new WeakMap(), _Calculator_numMul = new WeakMap(), _Calculator_hasPct = new WeakMap(), _Calculator_pctSum = new WeakMap(), _Calculator_pctMul = new WeakMap(), _Calculator_hasDim = new WeakMap(), _Calculator_dimSum = new WeakMap(), _Calculator_dimSub = new WeakMap(), _Calculator_dimMul = new WeakMap(), _Calculator_dimDiv = new WeakMap(), _Calculator_hasEtc = new WeakMap(), _Calculator_etcSum = new WeakMap(), _Calculator_etcSub = new WeakMap(), _Calculator_etcMul = new WeakMap(), _Calculator_etcDiv = new WeakMap();
/**
 * sort calc values
 * @param values - values to sort
 * @param [finalize] - finalize values
 * @returns sorted values
 */
export const sortCalcValues = (values = [], finalize = false) => {
    if (values.length < TRIA) {
        throw new Error(`Unexpected array length ${values.length}.`);
    }
    const start = values.shift();
    if (!isString(start) || !start.endsWith('(')) {
        throw new Error(`Unexpected token ${start}.`);
    }
    const end = values.pop();
    if (end !== ')') {
        throw new Error(`Unexpected token ${end}.`);
    }
    if (values.length === 1) {
        const [value] = values;
        if (!isStringOrNumber(value)) {
            throw new Error(`Unexpected token ${value}.`);
        }
        return `${start}${value}${end}`;
    }
    const sortedValues = [];
    const cal = new Calculator();
    let operator = '';
    const l = values.length;
    for (let i = 0; i < l; i++) {
        const value = values[i];
        if (!isStringOrNumber(value)) {
            throw new Error(`Unexpected token ${value}.`);
        }
        if (value === '*' || value === '/') {
            operator = value;
        }
        else if (value === '+' || value === '-') {
            const sortedValue = cal.multiply();
            if (sortedValue) {
                sortedValues.push(sortedValue, value);
            }
            cal.clear();
            operator = '';
        }
        else {
            const numValue = Number(value);
            const strValue = `${value}`;
            switch (operator) {
                case '/': {
                    if (Number.isFinite(numValue)) {
                        cal.hasNum = true;
                        cal.numMul.push(1 / numValue);
                    }
                    else if (REG_TYPE_PCT.test(strValue)) {
                        const [, val] = strValue.match(REG_TYPE_PCT);
                        cal.hasPct = true;
                        cal.pctMul.push((MAX_PCT * MAX_PCT) / Number(val));
                    }
                    else if (REG_TYPE_DIM.test(strValue)) {
                        cal.hasDim = true;
                        cal.dimDiv.push(strValue);
                    }
                    else {
                        cal.hasEtc = true;
                        cal.etcDiv.push(strValue);
                    }
                    break;
                }
                case '*':
                default: {
                    if (Number.isFinite(numValue)) {
                        cal.hasNum = true;
                        cal.numMul.push(numValue);
                    }
                    else if (REG_TYPE_PCT.test(strValue)) {
                        const [, val] = strValue.match(REG_TYPE_PCT);
                        cal.hasPct = true;
                        cal.pctMul.push(Number(val));
                    }
                    else if (REG_TYPE_DIM.test(strValue)) {
                        cal.hasDim = true;
                        cal.dimMul.push(strValue);
                    }
                    else {
                        cal.hasEtc = true;
                        cal.etcMul.push(strValue);
                    }
                }
            }
        }
        if (i === l - 1) {
            const sortedValue = cal.multiply();
            if (sortedValue) {
                sortedValues.push(sortedValue);
            }
            cal.clear();
            operator = '';
        }
    }
    let resolvedValue = '';
    if (finalize && (sortedValues.includes('+') || sortedValues.includes('-'))) {
        const finalizedValues = [];
        cal.clear();
        operator = '';
        const l = sortedValues.length;
        for (let i = 0; i < l; i++) {
            const value = sortedValues[i];
            if (isStringOrNumber(value)) {
                if (value === '+' || value === '-') {
                    operator = value;
                }
                else {
                    const numValue = Number(value);
                    const strValue = `${value}`;
                    switch (operator) {
                        case '-': {
                            if (Number.isFinite(numValue)) {
                                cal.hasNum = true;
                                cal.numSum.push(-1 * numValue);
                            }
                            else if (REG_TYPE_PCT.test(strValue)) {
                                const [, val] = strValue.match(REG_TYPE_PCT);
                                cal.hasPct = true;
                                cal.pctSum.push(-1 * Number(val));
                            }
                            else if (REG_TYPE_DIM.test(strValue)) {
                                cal.hasDim = true;
                                cal.dimSub.push(strValue);
                            }
                            else {
                                cal.hasEtc = true;
                                cal.etcSub.push(strValue);
                            }
                            break;
                        }
                        case '+':
                        default: {
                            if (Number.isFinite(numValue)) {
                                cal.hasNum = true;
                                cal.numSum.push(numValue);
                            }
                            else if (REG_TYPE_PCT.test(strValue)) {
                                const [, val] = strValue.match(REG_TYPE_PCT);
                                cal.hasPct = true;
                                cal.pctSum.push(Number(val));
                            }
                            else if (REG_TYPE_DIM.test(strValue)) {
                                cal.hasDim = true;
                                cal.dimSum.push(strValue);
                            }
                            else {
                                cal.hasEtc = true;
                                cal.etcSum.push(strValue);
                            }
                        }
                    }
                }
            }
            if (i === l - 1) {
                const sortedValue = cal.sum();
                if (sortedValue) {
                    finalizedValues.push(sortedValue);
                }
                cal.clear();
                operator = '';
            }
        }
        resolvedValue = finalizedValues.join(' ');
    }
    else {
        resolvedValue = sortedValues.join(' ');
    }
    return `${start}${resolvedValue}${end}`;
};
/**
 * serialize calc
 * @param value - CSS value
 * @param [opt] - options
 * @returns serialized value
 */
export const serializeCalc = (value, opt = {}) => {
    const { format = '' } = opt;
    if (isString(value)) {
        if (!REG_FN_VAR_START.test(value) || format !== VAL_SPEC) {
            return value;
        }
        value = value.toLowerCase().trim();
    }
    else {
        throw new TypeError(`${value} is not a string.`);
    }
    const cacheKey = createCacheKey({
        namespace: NAMESPACE,
        name: 'serializeCalc',
        value
    }, opt);
    const cachedResult = getCache(cacheKey);
    if (cachedResult instanceof CacheItem) {
        return cachedResult.item;
    }
    const items = tokenize({ css: value })
        .map((token) => {
        const [type, value] = token;
        let res = '';
        if (type !== W_SPACE && type !== COMMENT) {
            res = value;
        }
        return res;
    })
        .filter(v => v);
    let startIndex = items.findLastIndex((item) => /\($/.test(item));
    while (startIndex) {
        const endIndex = items.findIndex((item, index) => {
            return item === ')' && index > startIndex;
        });
        const slicedValues = items.slice(startIndex, endIndex + 1);
        let serializedValue = sortCalcValues(slicedValues);
        if (REG_FN_VAR_START.test(serializedValue)) {
            serializedValue = calc(serializedValue, {
                toCanonicalUnits: true
            });
        }
        items.splice(startIndex, endIndex - startIndex + 1, serializedValue);
        startIndex = items.findLastIndex((item) => /\($/.test(item));
    }
    const serializedCalc = sortCalcValues(items, true);
    setCache(cacheKey, serializedCalc);
    return serializedCalc;
};
/**
 * resolve dimension
 * @param token - CSS token
 * @param [opt] - options
 * @returns resolved value
 */
export const resolveDimension = (token, opt = {}) => {
    if (!Array.isArray(token)) {
        throw new TypeError(`${token} is not an array.`);
    }
    const [, , , , detail = {}] = token;
    const { unit, value } = detail;
    const { dimension = {} } = opt;
    if (unit === 'px') {
        return `${value}${unit}`;
    }
    const relativeValue = Number(value);
    if (unit && Number.isFinite(relativeValue)) {
        let pixelValue;
        if (Object.hasOwnProperty.call(dimension, unit)) {
            pixelValue = dimension[unit];
        }
        else if (typeof dimension.callback === 'function') {
            pixelValue = dimension.callback(unit);
        }
        pixelValue = Number(pixelValue);
        if (Number.isFinite(pixelValue)) {
            return `${relativeValue * pixelValue}px`;
        }
    }
    return new NullObject();
};
/**
 * parse tokens
 * @param tokens - CSS tokens
 * @param [opt] - options
 * @returns parsed tokens
 */
export const parseTokens = (tokens, opt = {}) => {
    if (!Array.isArray(tokens)) {
        throw new TypeError(`${tokens} is not an array.`);
    }
    const { format = '' } = opt;
    const mathFunc = new Set();
    let nest = 0;
    const res = [];
    while (tokens.length) {
        const token = tokens.shift();
        if (!Array.isArray(token)) {
            throw new TypeError(`${token} is not an array.`);
        }
        const [type = '', value = ''] = token;
        switch (type) {
            case DIM: {
                if (format === VAL_SPEC && !mathFunc.has(nest)) {
                    res.push(value);
                }
                else {
                    const resolvedValue = resolveDimension(token, opt);
                    if (isString(resolvedValue)) {
                        res.push(resolvedValue);
                    }
                    else {
                        res.push(value);
                    }
                }
                break;
            }
            case FUNC:
            case PAREN_OPEN: {
                res.push(value);
                nest++;
                if (REG_FN_MATH_START.test(value)) {
                    mathFunc.add(nest);
                }
                break;
            }
            case PAREN_CLOSE: {
                if (res.length) {
                    const lastValue = res[res.length - 1];
                    if (lastValue === ' ') {
                        res.splice(-1, 1, value);
                    }
                    else {
                        res.push(value);
                    }
                }
                else {
                    res.push(value);
                }
                if (mathFunc.has(nest)) {
                    mathFunc.delete(nest);
                }
                nest--;
                break;
            }
            case W_SPACE: {
                if (res.length) {
                    const lastValue = res[res.length - 1];
                    if (isString(lastValue) &&
                        !lastValue.endsWith('(') &&
                        lastValue !== ' ') {
                        res.push(value);
                    }
                }
                break;
            }
            default: {
                if (type !== COMMENT && type !== EOF) {
                    res.push(value);
                }
            }
        }
    }
    return res;
};
/**
 * CSS calc()
 * @param value - CSS value including calc()
 * @param [opt] - options
 * @returns resolved value
 */
export const cssCalc = (value, opt = {}) => {
    const { format = '' } = opt;
    if (isString(value)) {
        if (REG_FN_VAR.test(value)) {
            if (format === VAL_SPEC) {
                return value;
            }
            else {
                const resolvedValue = resolveVar(value, opt);
                if (isString(resolvedValue)) {
                    return resolvedValue;
                }
                else {
                    return '';
                }
            }
        }
        else if (!REG_FN_CALC.test(value)) {
            return value;
        }
        value = value.toLowerCase().trim();
    }
    else {
        throw new TypeError(`${value} is not a string.`);
    }
    const cacheKey = createCacheKey({
        namespace: NAMESPACE,
        name: 'cssCalc',
        value
    }, opt);
    const cachedResult = getCache(cacheKey);
    if (cachedResult instanceof CacheItem) {
        return cachedResult.item;
    }
    const tokens = tokenize({ css: value });
    const values = parseTokens(tokens, opt);
    let resolvedValue = calc(values.join(''), {
        toCanonicalUnits: true
    });
    if (REG_FN_VAR_START.test(value)) {
        if (REG_TYPE_DIM_PCT.test(resolvedValue)) {
            const [, val, unit] = resolvedValue.match(REG_TYPE_DIM_PCT);
            resolvedValue = `${roundToPrecision(Number(val), HEX)}${unit}`;
        }
        // wrap with `calc()`
        if (resolvedValue &&
            !REG_FN_VAR_START.test(resolvedValue) &&
            format === VAL_SPEC) {
            resolvedValue = `calc(${resolvedValue})`;
        }
    }
    setCache(cacheKey, resolvedValue);
    return resolvedValue;
};

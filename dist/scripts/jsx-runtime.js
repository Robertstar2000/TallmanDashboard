import * as ReactJSXRuntime from 'react/jsx-runtime';
import Emotion, { createEmotionProps } from './emotion-element';
import { hasOwn } from './utils';
export const Fragment = ReactJSXRuntime.Fragment;
export const jsx = (type, props, key) => {
    if (!hasOwn.call(props, 'css')) {
        return ReactJSXRuntime.jsx(type, props, key);
    }
    return ReactJSXRuntime.jsx(Emotion, createEmotionProps(type, props), key);
};
export const jsxs = (type, props, key) => {
    if (!hasOwn.call(props, 'css')) {
        return ReactJSXRuntime.jsxs(type, props, key);
    }
    return ReactJSXRuntime.jsxs(Emotion, createEmotionProps(type, props), key);
};

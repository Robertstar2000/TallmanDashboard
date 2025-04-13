import * as React from 'react';
import Emotion, { createEmotionProps } from './emotion-element';
import { hasOwn } from './utils';
export const jsx = function (type, props) {
    // eslint-disable-next-line prefer-rest-params
    let args = arguments;
    if (props == null || !hasOwn.call(props, 'css')) {
        return React.createElement.apply(undefined, args);
    }
    let argsLength = args.length;
    let createElementArgArray = new Array(argsLength);
    createElementArgArray[0] = Emotion;
    createElementArgArray[1] = createEmotionProps(type, props);
    for (let i = 2; i < argsLength; i++) {
        createElementArgArray[i] = args[i];
    }
    return React.createElement.apply(null, createElementArgArray);
};

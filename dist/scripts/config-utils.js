import { createClassGroupUtils } from './class-group-utils';
import { createLruCache } from './lru-cache';
import { createParseClassName } from './parse-class-name';
export const createConfigUtils = (config) => (Object.assign({ cache: createLruCache(config.cacheSize), parseClassName: createParseClassName(config) }, createClassGroupUtils(config)));

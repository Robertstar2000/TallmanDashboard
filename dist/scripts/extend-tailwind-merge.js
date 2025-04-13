import { createTailwindMerge } from './create-tailwind-merge';
import { getDefaultConfig } from './default-config';
import { mergeConfigs } from './merge-configs';
export const extendTailwindMerge = (configExtension, ...createConfig) => typeof configExtension === 'function'
    ? createTailwindMerge(getDefaultConfig, configExtension, ...createConfig)
    : createTailwindMerge(() => mergeConfigs(getDefaultConfig(), configExtension), ...createConfig);

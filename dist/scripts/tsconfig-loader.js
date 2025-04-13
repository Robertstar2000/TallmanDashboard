import * as path from "path";
import * as fs from "fs";
export function tsConfigLoader({ getEnv, cwd, loadSync = loadSyncDefault, }) {
    const TS_NODE_PROJECT = getEnv("TS_NODE_PROJECT");
    const TS_NODE_BASEURL = getEnv("TS_NODE_BASEURL");
    // tsconfig.loadSync handles if TS_NODE_PROJECT is a file or directory
    // and also overrides baseURL if TS_NODE_BASEURL is available.
    const loadResult = loadSync(cwd, TS_NODE_PROJECT, TS_NODE_BASEURL);
    return loadResult;
}
function loadSyncDefault(cwd, filename, baseUrl) {
    // Tsconfig.loadSync uses path.resolve. This is why we can use an absolute path as filename
    const configPath = resolveConfigPath(cwd, filename);
    if (!configPath) {
        return {
            tsConfigPath: undefined,
            baseUrl: undefined,
            paths: undefined,
        };
    }
    const config = loadTsconfig(configPath);
    return {
        tsConfigPath: configPath,
        baseUrl: baseUrl ||
            (config && config.compilerOptions && config.compilerOptions.baseUrl),
        paths: config && config.compilerOptions && config.compilerOptions.paths,
    };
}
function resolveConfigPath(cwd, filename) {
    if (filename) {
        const absolutePath = fs.lstatSync(filename).isDirectory()
            ? path.resolve(filename, "./tsconfig.json")
            : path.resolve(cwd, filename);
        return absolutePath;
    }
    if (fs.statSync(cwd).isFile()) {
        return path.resolve(cwd);
    }
    const configAbsolutePath = walkForTsConfig(cwd);
    return configAbsolutePath ? path.resolve(configAbsolutePath) : undefined;
}
export function walkForTsConfig(directory, existsSync = fs.existsSync) {
    const configPath = path.join(directory, "./tsconfig.json");
    if (existsSync(configPath)) {
        return configPath;
    }
    const parentDirectory = path.join(directory, "../");
    // If we reached the top
    if (directory === parentDirectory) {
        return undefined;
    }
    return walkForTsConfig(parentDirectory, existsSync);
}
export function loadTsconfig(configFilePath, existsSync = fs.existsSync, readFileSync = (filename) => fs.readFileSync(filename, "utf8")) {
    if (!existsSync(configFilePath)) {
        return undefined;
    }
    const configString = readFileSync(configFilePath);
    const cleanedJson = StripBom(configString);
    let config;
    try {
        config = JSON5.parse(cleanedJson);
    }
    catch (e) {
        throw new Error(`${configFilePath} is malformed ${e.message}`);
    }
    let extendedConfig = config.extends;
    if (extendedConfig) {
        let base;
        if (Array.isArray(extendedConfig)) {
            base = extendedConfig.reduce((currBase, extendedConfigElement) => mergeTsconfigs(currBase, loadTsconfigFromExtends(configFilePath, extendedConfigElement, existsSync, readFileSync)), {});
        }
        else {
            base = loadTsconfigFromExtends(configFilePath, extendedConfig, existsSync, readFileSync);
        }
        return mergeTsconfigs(base, config);
    }
    return config;
}
/**
 * Intended to be called only from loadTsconfig.
 * Parameters don't have defaults because they should use the same as loadTsconfig.
 */
function loadTsconfigFromExtends(configFilePath, extendedConfigValue, 
// eslint-disable-next-line no-shadow
existsSync, readFileSync) {
    var _a;
    if (typeof extendedConfigValue === "string" &&
        extendedConfigValue.indexOf(".json") === -1) {
        extendedConfigValue += ".json";
    }
    const currentDir = path.dirname(configFilePath);
    let extendedConfigPath = path.join(currentDir, extendedConfigValue);
    if (extendedConfigValue.indexOf("/") !== -1 &&
        extendedConfigValue.indexOf(".") !== -1 &&
        !existsSync(extendedConfigPath)) {
        extendedConfigPath = path.join(currentDir, "node_modules", extendedConfigValue);
    }
    const config = loadTsconfig(extendedConfigPath, existsSync, readFileSync) || {};
    // baseUrl should be interpreted as relative to extendedConfigPath,
    // but we need to update it so it is relative to the original tsconfig being loaded
    if ((_a = config.compilerOptions) === null || _a === void 0 ? void 0 : _a.baseUrl) {
        const extendsDir = path.dirname(extendedConfigValue);
        config.compilerOptions.baseUrl = path.join(extendsDir, config.compilerOptions.baseUrl);
    }
    return config;
}
function mergeTsconfigs(base, config) {
    base = base || {};
    config = config || {};
    return Object.assign(Object.assign(Object.assign({}, base), config), { compilerOptions: Object.assign(Object.assign({}, base.compilerOptions), config.compilerOptions) });
}

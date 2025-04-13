import * as TsConfigLoader2 from "./tsconfig-loader";
import * as path from "path";
import { options } from "./options";
export function loadConfig(cwd = options.cwd) {
    return configLoader({ cwd: cwd });
}
export function configLoader({ cwd, explicitParams, tsConfigLoader = TsConfigLoader2.tsConfigLoader, }) {
    if (explicitParams) {
        // tslint:disable-next-line:no-shadowed-variable
        const absoluteBaseUrl = path.isAbsolute(explicitParams.baseUrl)
            ? explicitParams.baseUrl
            : path.join(cwd, explicitParams.baseUrl);
        return {
            resultType: "success",
            configFileAbsolutePath: "",
            baseUrl: explicitParams.baseUrl,
            absoluteBaseUrl,
            paths: explicitParams.paths,
            mainFields: explicitParams.mainFields,
            addMatchAll: explicitParams.addMatchAll,
        };
    }
    // Load tsconfig and create path matching function
    const loadResult = tsConfigLoader({
        cwd,
        getEnv: (key) => process.env[key],
    });
    if (!loadResult.tsConfigPath) {
        return {
            resultType: "failed",
            message: "Couldn't find tsconfig.json",
        };
    }
    if (!loadResult.baseUrl) {
        return {
            resultType: "failed",
            message: "Missing baseUrl in compilerOptions",
        };
    }
    const tsConfigDir = path.dirname(loadResult.tsConfigPath);
    const absoluteBaseUrl = path.join(tsConfigDir, loadResult.baseUrl);
    return {
        resultType: "success",
        configFileAbsolutePath: loadResult.tsConfigPath,
        baseUrl: loadResult.baseUrl,
        absoluteBaseUrl,
        paths: loadResult.paths || {},
    };
}

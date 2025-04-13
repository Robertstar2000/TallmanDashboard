import * as path from "path";
import * as Filesystem from "./filesystem";
import * as MappingEntry from "./mapping-entry";
import * as TryPath from "./try-path";
/**
 * Creates a function that can resolve paths according to tsconfig paths property.
 * @param absoluteBaseUrl Absolute version of baseUrl as specified in tsconfig.
 * @param paths The paths as specified in tsconfig.
 * @param mainFields A list of package.json field names to try when resolving module files.
 * @param addMatchAll Add a match-all "*" rule if none is present
 * @returns a function that can resolve paths.
 */
export function createMatchPath(absoluteBaseUrl, paths, mainFields = ["main"], addMatchAll = true) {
    const absolutePaths = MappingEntry.getAbsoluteMappingEntries(absoluteBaseUrl, paths, addMatchAll);
    return (requestedModule, readJson, fileExists, extensions) => matchFromAbsolutePaths(absolutePaths, requestedModule, readJson, fileExists, extensions, mainFields);
}
/**
 * Finds a path from tsconfig that matches a module load request.
 * @param absolutePathMappings The paths to try as specified in tsconfig but resolved to absolute form.
 * @param requestedModule The required module name.
 * @param readJson Function that can read json from a path (useful for testing).
 * @param fileExists Function that checks for existence of a file at a path (useful for testing).
 * @param extensions File extensions to probe for (useful for testing).
 * @param mainFields A list of package.json field names to try when resolving module files.
 * @returns the found path, or undefined if no path was found.
 */
export function matchFromAbsolutePaths(absolutePathMappings, requestedModule, readJson = Filesystem.readJsonFromDiskSync, fileExists = Filesystem.fileExistsSync, extensions = Object.keys(require.extensions), mainFields = ["main"]) {
    const tryPaths = TryPath.getPathsToTry(extensions, absolutePathMappings, requestedModule);
    if (!tryPaths) {
        return undefined;
    }
    return findFirstExistingPath(tryPaths, readJson, fileExists, mainFields);
}
function findFirstExistingMainFieldMappedFile(packageJson, mainFields, packageJsonPath, fileExists) {
    for (let index = 0; index < mainFields.length; index++) {
        const mainFieldName = mainFields[index];
        const candidateMapping = packageJson[mainFieldName];
        if (candidateMapping && typeof candidateMapping === "string") {
            const candidateFilePath = path.join(path.dirname(packageJsonPath), candidateMapping);
            if (fileExists(candidateFilePath)) {
                return candidateFilePath;
            }
        }
    }
    return undefined;
}
function findFirstExistingPath(tryPaths, readJson = Filesystem.readJsonFromDiskSync, fileExists, mainFields = ["main"]) {
    for (const tryPath of tryPaths) {
        if (tryPath.type === "file" ||
            tryPath.type === "extension" ||
            tryPath.type === "index") {
            if (fileExists(tryPath.path)) {
                return TryPath.getStrippedPath(tryPath);
            }
        }
        else if (tryPath.type === "package") {
            const packageJson = readJson(tryPath.path);
            if (packageJson) {
                const mainFieldMappedFile = findFirstExistingMainFieldMappedFile(packageJson, mainFields, tryPath.path, fileExists);
                if (mainFieldMappedFile) {
                    return mainFieldMappedFile;
                }
            }
        }
        else {
            TryPath.exhaustiveTypeException(tryPath.type);
        }
    }
    return undefined;
}

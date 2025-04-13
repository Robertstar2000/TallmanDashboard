import * as path from "path";
import * as TryPath from "./try-path";
import * as MappingEntry from "./mapping-entry";
import * as Filesystem from "./filesystem";
/**
 * See the sync version for docs.
 */
export function createMatchPathAsync(absoluteBaseUrl, paths, mainFields = ["main"], addMatchAll = true) {
    const absolutePaths = MappingEntry.getAbsoluteMappingEntries(absoluteBaseUrl, paths, addMatchAll);
    return (requestedModule, readJson, fileExists, extensions, callback) => matchFromAbsolutePathsAsync(absolutePaths, requestedModule, readJson, fileExists, extensions, callback, mainFields);
}
/**
 * See the sync version for docs.
 */
export function matchFromAbsolutePathsAsync(absolutePathMappings, requestedModule, readJson = Filesystem.readJsonFromDiskAsync, fileExists = Filesystem.fileExistsAsync, extensions = Object.keys(require.extensions), callback, mainFields = ["main"]) {
    const tryPaths = TryPath.getPathsToTry(extensions, absolutePathMappings, requestedModule);
    if (!tryPaths) {
        return callback();
    }
    findFirstExistingPath(tryPaths, readJson, fileExists, callback, 0, mainFields);
}
function findFirstExistingMainFieldMappedFile(packageJson, mainFields, packageJsonPath, fileExistsAsync, doneCallback, index = 0) {
    if (index >= mainFields.length) {
        return doneCallback(undefined, undefined);
    }
    const tryNext = () => findFirstExistingMainFieldMappedFile(packageJson, mainFields, packageJsonPath, fileExistsAsync, doneCallback, index + 1);
    const mainFieldMapping = packageJson[mainFields[index]];
    if (typeof mainFieldMapping !== "string") {
        // Skip mappings that are not pointers to replacement files
        return tryNext();
    }
    const mappedFilePath = path.join(path.dirname(packageJsonPath), mainFieldMapping);
    fileExistsAsync(mappedFilePath, (err, exists) => {
        if (err) {
            return doneCallback(err);
        }
        if (exists) {
            return doneCallback(undefined, mappedFilePath);
        }
        return tryNext();
    });
}
// Recursive loop to probe for physical files
function findFirstExistingPath(tryPaths, readJson, fileExists, doneCallback, index = 0, mainFields = ["main"]) {
    const tryPath = tryPaths[index];
    if (tryPath.type === "file" ||
        tryPath.type === "extension" ||
        tryPath.type === "index") {
        fileExists(tryPath.path, (err, exists) => {
            if (err) {
                return doneCallback(err);
            }
            if (exists) {
                return doneCallback(undefined, TryPath.getStrippedPath(tryPath));
            }
            if (index === tryPaths.length - 1) {
                return doneCallback();
            }
            // Continue with the next path
            return findFirstExistingPath(tryPaths, readJson, fileExists, doneCallback, index + 1, mainFields);
        });
    }
    else if (tryPath.type === "package") {
        readJson(tryPath.path, (err, packageJson) => {
            if (err) {
                return doneCallback(err);
            }
            if (packageJson) {
                return findFirstExistingMainFieldMappedFile(packageJson, mainFields, tryPath.path, fileExists, (mainFieldErr, mainFieldMappedFile) => {
                    if (mainFieldErr) {
                        return doneCallback(mainFieldErr);
                    }
                    if (mainFieldMappedFile) {
                        return doneCallback(undefined, mainFieldMappedFile);
                    }
                    // No field in package json was a valid option. Continue with the next path.
                    return findFirstExistingPath(tryPaths, readJson, fileExists, doneCallback, index + 1, mainFields);
                });
            }
            // This is async code, we need to return unconditionally, otherwise the code still falls
            // through and keeps recursing. While this might work in general, libraries that use neo-async
            // like Webpack will actually not allow you to call the same callback twice.
            //
            // An example of where this caused issues:
            // https://github.com/dividab/tsconfig-paths-webpack-plugin/issues/11
            //
            // Continue with the next path
            return findFirstExistingPath(tryPaths, readJson, fileExists, doneCallback, index + 1, mainFields);
        });
    }
    else {
        TryPath.exhaustiveTypeException(tryPath.type);
    }
}

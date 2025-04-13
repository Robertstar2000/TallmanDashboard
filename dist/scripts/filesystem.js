import * as fs from "fs";
export function fileExistsSync(path) {
    try {
        const stats = fs.statSync(path);
        return stats.isFile();
    }
    catch (err) {
        // If error, assume file did not exist
        return false;
    }
}
/**
 * Reads package.json from disk
 * @param file Path to package.json
 */
// tslint:disable-next-line:no-any
export function readJsonFromDiskSync(packageJsonPath) {
    if (!fs.existsSync(packageJsonPath)) {
        return undefined;
    }
    return require(packageJsonPath);
}
export function readJsonFromDiskAsync(path, 
// tslint:disable-next-line:no-any
callback) {
    fs.readFile(path, "utf8", (err, result) => {
        // If error, assume file did not exist
        if (err || !result) {
            return callback();
        }
        const json = JSON.parse(result);
        return callback(undefined, json);
    });
}
export function fileExistsAsync(path2, callback2) {
    fs.stat(path2, (err, stats) => {
        if (err) {
            // If error assume file does not exist
            return callback2(undefined, false);
        }
        callback2(undefined, stats ? stats.isFile() : false);
    });
}
export function removeExtension(path) {
    return path.substring(0, path.lastIndexOf(".")) || path;
}

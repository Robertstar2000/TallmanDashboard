import jitiFactory from 'jiti';
import { transform } from 'sucrase';
let jiti = null;
// @internal
// This WILL be removed in some future release
// If you rely on this your stuff WILL break
export function useCustomJiti(_jiti) {
    jiti = _jiti();
}
function lazyJiti() {
    return (jiti !== null && jiti !== void 0 ? jiti : (jiti = jitiFactory(__filename, {
        interopDefault: true,
        transform: (opts) => {
            // Sucrase can't transform import.meta so we have to use Babel
            if (opts.source.includes('import.meta')) {
                return require('jiti/dist/babel.js')(opts);
            }
            return transform(opts.source, {
                transforms: ['typescript', 'imports'],
            });
        },
    })));
}
export function loadConfig(path) {
    var _a;
    let config = (function () {
        if (!path)
            return {};
        // Always use jiti for now. There is a a bug that occurs in Node v22.12+
        // where imported files return invalid results
        return lazyJiti()(path);
        // Always use jiti for ESM or TS files
        if (path &&
            (path.endsWith('.mjs') ||
                path.endsWith('.ts') ||
                path.endsWith('.cts') ||
                path.endsWith('.mts'))) {
            return lazyJiti()(path);
        }
        try {
            return path ? require(path) : {};
        }
        catch (_a) {
            return lazyJiti()(path);
        }
    })();
    return (_a = config.default) !== null && _a !== void 0 ? _a : config;
}

import { resolveUrl, normalizeId, getFullPath } from "./resolve";
export default class MissingRefError extends Error {
    constructor(resolver, baseId, ref, msg) {
        super(msg || `can't resolve reference ${ref} from id ${baseId}`);
        this.missingRef = resolveUrl(resolver, baseId, ref);
        this.missingSchema = normalizeId(getFullPath(resolver, this.missingRef));
    }
}

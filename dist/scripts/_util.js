import { _ } from "ajv/dist/compile/codegen";
const META_SCHEMA_ID = "http://json-schema.org/schema";
export function metaSchemaRef({ defaultMeta } = {}) {
    return defaultMeta === false ? {} : { $ref: defaultMeta || META_SCHEMA_ID };
}
export function usePattern({ gen, it: { opts } }, pattern, flags = opts.unicodeRegExp ? "u" : "") {
    const rx = new RegExp(pattern, flags);
    return gen.scopeValue("pattern", {
        key: rx.toString(),
        ref: rx,
        code: _ `new RegExp(${pattern}, ${flags})`,
    });
}

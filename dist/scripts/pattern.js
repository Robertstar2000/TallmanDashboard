import { usePattern } from "../code";
import { _, str } from "../../compile/codegen";
const error = {
    message: ({ schemaCode }) => str `must match pattern "${schemaCode}"`,
    params: ({ schemaCode }) => _ `{pattern: ${schemaCode}}`,
};
const def = {
    keyword: "pattern",
    type: "string",
    schemaType: "string",
    $data: true,
    error,
    code(cxt) {
        const { data, $data, schema, schemaCode, it } = cxt;
        // TODO regexp should be wrapped in try/catchs
        const u = it.opts.unicodeRegExp ? "u" : "";
        const regExp = $data ? _ `(new RegExp(${schemaCode}, ${u}))` : usePattern(cxt, schema);
        cxt.fail$data(_ `!${regExp}.test(${data})`);
    },
};
export default def;

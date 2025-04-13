import { _, str, operators } from "../../compile/codegen";
import { useFunc } from "../../compile/util";
import ucs2length from "../../runtime/ucs2length";
const error = {
    message({ keyword, schemaCode }) {
        const comp = keyword === "maxLength" ? "more" : "fewer";
        return str `must NOT have ${comp} than ${schemaCode} characters`;
    },
    params: ({ schemaCode }) => _ `{limit: ${schemaCode}}`,
};
const def = {
    keyword: ["maxLength", "minLength"],
    type: "string",
    schemaType: "number",
    $data: true,
    error,
    code(cxt) {
        const { keyword, data, schemaCode, it } = cxt;
        const op = keyword === "maxLength" ? operators.GT : operators.LT;
        const len = it.opts.unicode === false ? _ `${data}.length` : _ `${useFunc(cxt.gen, ucs2length)}(${data})`;
        cxt.fail$data(_ `${len} ${op} ${schemaCode}`);
    },
};
export default def;

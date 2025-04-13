import { _, str, operators } from "../../compile/codegen";
const error = {
    message({ keyword, schemaCode }) {
        const comp = keyword === "maxItems" ? "more" : "fewer";
        return str `must NOT have ${comp} than ${schemaCode} items`;
    },
    params: ({ schemaCode }) => _ `{limit: ${schemaCode}}`,
};
const def = {
    keyword: ["maxItems", "minItems"],
    type: "array",
    schemaType: "number",
    $data: true,
    error,
    code(cxt) {
        const { keyword, data, schemaCode } = cxt;
        const op = keyword === "maxItems" ? operators.GT : operators.LT;
        cxt.fail$data(_ `${data}.length ${op} ${schemaCode}`);
    },
};
export default def;

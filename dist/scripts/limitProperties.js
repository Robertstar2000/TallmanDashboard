import { _, str, operators } from "../../compile/codegen";
const error = {
    message({ keyword, schemaCode }) {
        const comp = keyword === "maxProperties" ? "more" : "fewer";
        return str `must NOT have ${comp} than ${schemaCode} properties`;
    },
    params: ({ schemaCode }) => _ `{limit: ${schemaCode}}`,
};
const def = {
    keyword: ["maxProperties", "minProperties"],
    type: "object",
    schemaType: "number",
    $data: true,
    error,
    code(cxt) {
        const { keyword, data, schemaCode } = cxt;
        const op = keyword === "maxProperties" ? operators.GT : operators.LT;
        cxt.fail$data(_ `Object.keys(${data}).length ${op} ${schemaCode}`);
    },
};
export default def;

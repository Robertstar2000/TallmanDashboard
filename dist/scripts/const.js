import { _ } from "../../compile/codegen";
import { useFunc } from "../../compile/util";
import equal from "../../runtime/equal";
const error = {
    message: "must be equal to constant",
    params: ({ schemaCode }) => _ `{allowedValue: ${schemaCode}}`,
};
const def = {
    keyword: "const",
    $data: true,
    error,
    code(cxt) {
        const { gen, data, $data, schemaCode, schema } = cxt;
        if ($data || (schema && typeof schema == "object")) {
            cxt.fail$data(_ `!${useFunc(gen, equal)}(${data}, ${schemaCode})`);
        }
        else {
            cxt.fail(_ `${schema} !== ${data}`);
        }
    },
};
export default def;

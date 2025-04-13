import { alwaysValidSchema } from "../../compile/util";
import { validateArray } from "../code";
import { _, not } from "../../compile/codegen";
import { checkMetadata } from "./metadata";
import { checkNullable } from "./nullable";
import { typeError } from "./error";
const def = {
    keyword: "elements",
    schemaType: "object",
    error: typeError("array"),
    code(cxt) {
        checkMetadata(cxt);
        const { gen, data, schema, it } = cxt;
        if (alwaysValidSchema(it, schema))
            return;
        const [valid] = checkNullable(cxt);
        gen.if(not(valid), () => gen.if(_ `Array.isArray(${data})`, () => gen.assign(valid, validateArray(cxt)), () => cxt.error()));
        cxt.ok(valid);
    },
};
export default def;

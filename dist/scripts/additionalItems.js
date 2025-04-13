import { _, str, not } from "../../compile/codegen";
import { alwaysValidSchema, checkStrictMode, Type } from "../../compile/util";
const error = {
    message: ({ params: { len } }) => str `must NOT have more than ${len} items`,
    params: ({ params: { len } }) => _ `{limit: ${len}}`,
};
const def = {
    keyword: "additionalItems",
    type: "array",
    schemaType: ["boolean", "object"],
    before: "uniqueItems",
    error,
    code(cxt) {
        const { parentSchema, it } = cxt;
        const { items } = parentSchema;
        if (!Array.isArray(items)) {
            checkStrictMode(it, '"additionalItems" is ignored when "items" is not an array of schemas');
            return;
        }
        validateAdditionalItems(cxt, items);
    },
};
export function validateAdditionalItems(cxt, items) {
    const { gen, schema, data, keyword, it } = cxt;
    it.items = true;
    const len = gen.const("len", _ `${data}.length`);
    if (schema === false) {
        cxt.setParams({ len: items.length });
        cxt.pass(_ `${len} <= ${items.length}`);
    }
    else if (typeof schema == "object" && !alwaysValidSchema(it, schema)) {
        const valid = gen.var("valid", _ `${len} <= ${items.length}`); // TODO var
        gen.if(not(valid), () => validateItems(valid));
        cxt.ok(valid);
    }
    function validateItems(valid) {
        gen.forRange("i", items.length, len, (i) => {
            cxt.subschema({ keyword, dataProp: i, dataPropType: Type.Num }, valid);
            if (!it.allErrors)
                gen.if(not(valid), () => gen.break());
        });
    }
}
export default def;

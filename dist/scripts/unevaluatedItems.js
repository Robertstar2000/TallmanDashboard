import { _, str, not } from "../../compile/codegen";
import { alwaysValidSchema, Type } from "../../compile/util";
const error = {
    message: ({ params: { len } }) => str `must NOT have more than ${len} items`,
    params: ({ params: { len } }) => _ `{limit: ${len}}`,
};
const def = {
    keyword: "unevaluatedItems",
    type: "array",
    schemaType: ["boolean", "object"],
    error,
    code(cxt) {
        const { gen, schema, data, it } = cxt;
        const items = it.items || 0;
        if (items === true)
            return;
        const len = gen.const("len", _ `${data}.length`);
        if (schema === false) {
            cxt.setParams({ len: items });
            cxt.fail(_ `${len} > ${items}`);
        }
        else if (typeof schema == "object" && !alwaysValidSchema(it, schema)) {
            const valid = gen.var("valid", _ `${len} <= ${items}`);
            gen.if(not(valid), () => validateItems(valid, items));
            cxt.ok(valid);
        }
        it.items = true;
        function validateItems(valid, from) {
            gen.forRange("i", from, len, (i) => {
                cxt.subschema({ keyword: "unevaluatedItems", dataProp: i, dataPropType: Type.Num }, valid);
                if (!it.allErrors)
                    gen.if(not(valid), () => gen.break());
            });
        }
    },
};
export default def;

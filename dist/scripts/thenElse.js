import { checkStrictMode } from "../../compile/util";
const def = {
    keyword: ["then", "else"],
    schemaType: ["object", "boolean"],
    code({ keyword, parentSchema, it }) {
        if (parentSchema.if === undefined)
            checkStrictMode(it, `"${keyword}" without "if" is ignored`);
    },
};
export default def;

import { checkStrictMode } from "../../compile/util";
const def = {
    keyword: ["maxContains", "minContains"],
    type: "array",
    schemaType: "number",
    code({ keyword, parentSchema, it }) {
        if (parentSchema.contains === undefined) {
            checkStrictMode(it, `"${keyword}" without "contains" is ignored`);
        }
    },
};
export default def;

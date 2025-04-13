import { validateTuple } from "./items";
const def = {
    keyword: "prefixItems",
    type: "array",
    schemaType: ["array"],
    before: "uniqueItems",
    code: (cxt) => validateTuple(cxt, "items"),
};
export default def;

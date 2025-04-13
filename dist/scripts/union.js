import { validateUnion } from "../code";
const def = {
    keyword: "union",
    schemaType: "array",
    trackErrors: true,
    code: validateUnion,
    error: { message: "must match a schema in union" },
};
export default def;

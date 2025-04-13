import { validateUnion } from "../code";
const def = {
    keyword: "anyOf",
    schemaType: "array",
    trackErrors: true,
    code: validateUnion,
    error: { message: "must match a schema in anyOf" },
};
export default def;

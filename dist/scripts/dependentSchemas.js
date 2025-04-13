import { validateSchemaDeps } from "./dependencies";
const def = {
    keyword: "dependentSchemas",
    type: "object",
    schemaType: "object",
    code: (cxt) => validateSchemaDeps(cxt),
};
export default def;

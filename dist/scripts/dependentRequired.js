import { validatePropertyDeps, error, } from "../applicator/dependencies";
const def = {
    keyword: "dependentRequired",
    type: "object",
    schemaType: "object",
    error,
    code: (cxt) => validatePropertyDeps(cxt),
};
export default def;

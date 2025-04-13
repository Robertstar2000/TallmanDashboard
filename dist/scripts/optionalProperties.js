import { validateProperties, error } from "./properties";
const def = {
    keyword: "optionalProperties",
    schemaType: "object",
    error,
    code(cxt) {
        if (cxt.parentSchema.properties)
            return;
        validateProperties(cxt);
    },
};
export default def;

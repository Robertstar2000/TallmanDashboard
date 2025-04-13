import { dynamicRef } from "./dynamicRef";
const def = {
    keyword: "$recursiveRef",
    schemaType: "string",
    code: (cxt) => dynamicRef(cxt, cxt.schema),
};
export default def;

import { _, nil, or } from "../../compile/codegen";
import validTimestamp from "../../runtime/timestamp";
import { useFunc } from "../../compile/util";
import { checkMetadata } from "./metadata";
import { typeErrorMessage, typeErrorParams } from "./error";
export const intRange = {
    int8: [-128, 127, 3],
    uint8: [0, 255, 3],
    int16: [-32768, 32767, 5],
    uint16: [0, 65535, 5],
    int32: [-2147483648, 2147483647, 10],
    uint32: [0, 4294967295, 10],
};
const error = {
    message: (cxt) => typeErrorMessage(cxt, cxt.schema),
    params: (cxt) => typeErrorParams(cxt, cxt.schema),
};
function timestampCode(cxt) {
    const { gen, data, it } = cxt;
    const { timestamp, allowDate } = it.opts;
    if (timestamp === "date")
        return _ `${data} instanceof Date `;
    const vts = useFunc(gen, validTimestamp);
    const allowDateArg = allowDate ? _ `, true` : nil;
    const validString = _ `typeof ${data} == "string" && ${vts}(${data}${allowDateArg})`;
    return timestamp === "string" ? validString : or(_ `${data} instanceof Date`, validString);
}
const def = {
    keyword: "type",
    schemaType: "string",
    error,
    code(cxt) {
        checkMetadata(cxt);
        const { data, schema, parentSchema, it } = cxt;
        let cond;
        switch (schema) {
            case "boolean":
            case "string":
                cond = _ `typeof ${data} == ${schema}`;
                break;
            case "timestamp": {
                cond = timestampCode(cxt);
                break;
            }
            case "float32":
            case "float64":
                cond = _ `typeof ${data} == "number"`;
                break;
            default: {
                const sch = schema;
                cond = _ `typeof ${data} == "number" && isFinite(${data}) && !(${data} % 1)`;
                if (!it.opts.int32range && (sch === "int32" || sch === "uint32")) {
                    if (sch === "uint32")
                        cond = _ `${cond} && ${data} >= 0`;
                }
                else {
                    const [min, max] = intRange[sch];
                    cond = _ `${cond} && ${data} >= ${min} && ${data} <= ${max}`;
                }
            }
        }
        cxt.pass(parentSchema.nullable ? or(_ `${data} === null`, cond) : cond);
    },
};
export default def;

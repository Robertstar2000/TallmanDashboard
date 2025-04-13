import { alwaysValidSchema, Type } from "../../compile/util";
import { not, or } from "../../compile/codegen";
import { checkMetadata } from "./metadata";
import { checkNullableObject } from "./nullable";
import { typeError } from "./error";
const def = {
    keyword: "values",
    schemaType: "object",
    error: typeError("object"),
    code(cxt) {
        checkMetadata(cxt);
        const { gen, data, schema, it } = cxt;
        const [valid, cond] = checkNullableObject(cxt, data);
        if (alwaysValidSchema(it, schema)) {
            gen.if(not(or(cond, valid)), () => cxt.error());
        }
        else {
            gen.if(cond);
            gen.assign(valid, validateMap());
            gen.elseIf(not(valid));
            cxt.error();
            gen.endIf();
        }
        cxt.ok(valid);
        function validateMap() {
            const _valid = gen.name("valid");
            if (it.allErrors) {
                const validMap = gen.let("valid", true);
                validateValues(() => gen.assign(validMap, false));
                return validMap;
            }
            gen.var(_valid, true);
            validateValues(() => gen.break());
            return _valid;
            function validateValues(notValid) {
                gen.forIn("key", data, (key) => {
                    cxt.subschema({
                        keyword: "values",
                        dataProp: key,
                        dataPropType: Type.Str,
                    }, _valid);
                    gen.if(not(_valid), notValid);
                });
            }
        }
    },
};
export default def;

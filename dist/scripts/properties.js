import { propertyInData, allSchemaProperties, isOwnProperty } from "../code";
import { alwaysValidSchema, schemaRefOrVal } from "../../compile/util";
import { _, and, not } from "../../compile/codegen";
import { checkMetadata } from "./metadata";
import { checkNullableObject } from "./nullable";
import { typeErrorMessage, typeErrorParams } from "./error";
var PropError;
(function (PropError) {
    PropError["Additional"] = "additional";
    PropError["Missing"] = "missing";
})(PropError || (PropError = {}));
export const error = {
    message: (cxt) => {
        const { params } = cxt;
        return params.propError
            ? params.propError === PropError.Additional
                ? "must NOT have additional properties"
                : `must have property '${params.missingProperty}'`
            : typeErrorMessage(cxt, "object");
    },
    params: (cxt) => {
        const { params } = cxt;
        return params.propError
            ? params.propError === PropError.Additional
                ? _ `{error: ${params.propError}, additionalProperty: ${params.additionalProperty}}`
                : _ `{error: ${params.propError}, missingProperty: ${params.missingProperty}}`
            : typeErrorParams(cxt, "object");
    },
};
const def = {
    keyword: "properties",
    schemaType: "object",
    error,
    code: validateProperties,
};
// const error: KeywordErrorDefinition = {
//   message: "should NOT have additional properties",
//   params: ({params}) => _`{additionalProperty: ${params.additionalProperty}}`,
// }
export function validateProperties(cxt) {
    checkMetadata(cxt);
    const { gen, data, parentSchema, it } = cxt;
    const { additionalProperties, nullable } = parentSchema;
    if (it.jtdDiscriminator && nullable)
        throw new Error("JTD: nullable inside discriminator mapping");
    if (commonProperties()) {
        throw new Error("JTD: properties and optionalProperties have common members");
    }
    const [allProps, properties] = schemaProperties("properties");
    const [allOptProps, optProperties] = schemaProperties("optionalProperties");
    if (properties.length === 0 && optProperties.length === 0 && additionalProperties) {
        return;
    }
    const [valid, cond] = it.jtdDiscriminator === undefined
        ? checkNullableObject(cxt, data)
        : [gen.let("valid", false), true];
    gen.if(cond, () => gen.assign(valid, true).block(() => {
        validateProps(properties, "properties", true);
        validateProps(optProperties, "optionalProperties");
        if (!additionalProperties)
            validateAdditional();
    }));
    cxt.pass(valid);
    function commonProperties() {
        const props = parentSchema.properties;
        const optProps = parentSchema.optionalProperties;
        if (!(props && optProps))
            return false;
        for (const p in props) {
            if (Object.prototype.hasOwnProperty.call(optProps, p))
                return true;
        }
        return false;
    }
    function schemaProperties(keyword) {
        const schema = parentSchema[keyword];
        const allPs = schema ? allSchemaProperties(schema) : [];
        if (it.jtdDiscriminator && allPs.some((p) => p === it.jtdDiscriminator)) {
            throw new Error(`JTD: discriminator tag used in ${keyword}`);
        }
        const ps = allPs.filter((p) => !alwaysValidSchema(it, schema[p]));
        return [allPs, ps];
    }
    function validateProps(props, keyword, required) {
        const _valid = gen.var("valid");
        for (const prop of props) {
            gen.if(propertyInData(gen, data, prop, it.opts.ownProperties), () => applyPropertySchema(prop, keyword, _valid), () => missingProperty(prop));
            cxt.ok(_valid);
        }
        function missingProperty(prop) {
            if (required) {
                gen.assign(_valid, false);
                cxt.error(false, { propError: PropError.Missing, missingProperty: prop }, { schemaPath: prop });
            }
            else {
                gen.assign(_valid, true);
            }
        }
    }
    function applyPropertySchema(prop, keyword, _valid) {
        cxt.subschema({
            keyword,
            schemaProp: prop,
            dataProp: prop,
        }, _valid);
    }
    function validateAdditional() {
        gen.forIn("key", data, (key) => {
            const addProp = isAdditional(key, allProps, "properties", it.jtdDiscriminator);
            const addOptProp = isAdditional(key, allOptProps, "optionalProperties");
            const extra = addProp === true ? addOptProp : addOptProp === true ? addProp : and(addProp, addOptProp);
            gen.if(extra, () => {
                if (it.opts.removeAdditional) {
                    gen.code(_ `delete ${data}[${key}]`);
                }
                else {
                    cxt.error(false, { propError: PropError.Additional, additionalProperty: key }, { instancePath: key, parentSchema: true });
                    if (!it.opts.allErrors)
                        gen.break();
                }
            });
        });
    }
    function isAdditional(key, props, keyword, jtdDiscriminator) {
        let additional;
        if (props.length > 8) {
            // TODO maybe an option instead of hard-coded 8?
            const propsSchema = schemaRefOrVal(it, parentSchema[keyword], keyword);
            additional = not(isOwnProperty(gen, propsSchema, key));
            if (jtdDiscriminator !== undefined) {
                additional = and(additional, _ `${key} !== ${jtdDiscriminator}`);
            }
        }
        else if (props.length || jtdDiscriminator !== undefined) {
            const ps = jtdDiscriminator === undefined ? props : [jtdDiscriminator].concat(props);
            additional = and(...ps.map((p) => _ `${key} !== ${p}`));
        }
        else {
            additional = true;
        }
        return additional;
    }
}
export default def;

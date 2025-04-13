import { _, and, or, not, nil, strConcat, getProperty } from "../compile/codegen";
import { alwaysValidSchema, Type } from "../compile/util";
import N from "../compile/names";
import { useFunc } from "../compile/util";
export function checkReportMissingProp(cxt, prop) {
    const { gen, data, it } = cxt;
    gen.if(noPropertyInData(gen, data, prop, it.opts.ownProperties), () => {
        cxt.setParams({ missingProperty: _ `${prop}` }, true);
        cxt.error();
    });
}
export function checkMissingProp({ gen, data, it: { opts } }, properties, missing) {
    return or(...properties.map((prop) => and(noPropertyInData(gen, data, prop, opts.ownProperties), _ `${missing} = ${prop}`)));
}
export function reportMissingProp(cxt, missing) {
    cxt.setParams({ missingProperty: missing }, true);
    cxt.error();
}
export function hasPropFunc(gen) {
    return gen.scopeValue("func", {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        ref: Object.prototype.hasOwnProperty,
        code: _ `Object.prototype.hasOwnProperty`,
    });
}
export function isOwnProperty(gen, data, property) {
    return _ `${hasPropFunc(gen)}.call(${data}, ${property})`;
}
export function propertyInData(gen, data, property, ownProperties) {
    const cond = _ `${data}${getProperty(property)} !== undefined`;
    return ownProperties ? _ `${cond} && ${isOwnProperty(gen, data, property)}` : cond;
}
export function noPropertyInData(gen, data, property, ownProperties) {
    const cond = _ `${data}${getProperty(property)} === undefined`;
    return ownProperties ? or(cond, not(isOwnProperty(gen, data, property))) : cond;
}
export function allSchemaProperties(schemaMap) {
    return schemaMap ? Object.keys(schemaMap).filter((p) => p !== "__proto__") : [];
}
export function schemaProperties(it, schemaMap) {
    return allSchemaProperties(schemaMap).filter((p) => !alwaysValidSchema(it, schemaMap[p]));
}
export function callValidateCode({ schemaCode, data, it: { gen, topSchemaRef, schemaPath, errorPath }, it }, func, context, passSchema) {
    const dataAndSchema = passSchema ? _ `${schemaCode}, ${data}, ${topSchemaRef}${schemaPath}` : data;
    const valCxt = [
        [N.instancePath, strConcat(N.instancePath, errorPath)],
        [N.parentData, it.parentData],
        [N.parentDataProperty, it.parentDataProperty],
        [N.rootData, N.rootData],
    ];
    if (it.opts.dynamicRef)
        valCxt.push([N.dynamicAnchors, N.dynamicAnchors]);
    const args = _ `${dataAndSchema}, ${gen.object(...valCxt)}`;
    return context !== nil ? _ `${func}.call(${context}, ${args})` : _ `${func}(${args})`;
}
const newRegExp = _ `new RegExp`;
export function usePattern({ gen, it: { opts } }, pattern) {
    const u = opts.unicodeRegExp ? "u" : "";
    const { regExp } = opts.code;
    const rx = regExp(pattern, u);
    return gen.scopeValue("pattern", {
        key: rx.toString(),
        ref: rx,
        code: _ `${regExp.code === "new RegExp" ? newRegExp : useFunc(gen, regExp)}(${pattern}, ${u})`,
    });
}
export function validateArray(cxt) {
    const { gen, data, keyword, it } = cxt;
    const valid = gen.name("valid");
    if (it.allErrors) {
        const validArr = gen.let("valid", true);
        validateItems(() => gen.assign(validArr, false));
        return validArr;
    }
    gen.var(valid, true);
    validateItems(() => gen.break());
    return valid;
    function validateItems(notValid) {
        const len = gen.const("len", _ `${data}.length`);
        gen.forRange("i", 0, len, (i) => {
            cxt.subschema({
                keyword,
                dataProp: i,
                dataPropType: Type.Num,
            }, valid);
            gen.if(not(valid), notValid);
        });
    }
}
export function validateUnion(cxt) {
    const { gen, schema, keyword, it } = cxt;
    /* istanbul ignore if */
    if (!Array.isArray(schema))
        throw new Error("ajv implementation error");
    const alwaysValid = schema.some((sch) => alwaysValidSchema(it, sch));
    if (alwaysValid && !it.opts.unevaluated)
        return;
    const valid = gen.let("valid", false);
    const schValid = gen.name("_valid");
    gen.block(() => schema.forEach((_sch, i) => {
        const schCxt = cxt.subschema({
            keyword,
            schemaProp: i,
            compositeRule: true,
        }, schValid);
        gen.assign(valid, _ `${valid} || ${schValid}`);
        const merged = cxt.mergeValidEvaluated(schCxt, schValid);
        // can short-circuit if `unevaluatedProperties/Items` not supported (opts.unevaluated !== true)
        // or if all properties and items were evaluated (it.props === true && it.items === true)
        if (!merged)
            gen.if(not(valid));
    }));
    cxt.result(valid, () => cxt.reset(), () => cxt.error(true));
}

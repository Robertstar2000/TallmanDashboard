import { _, getProperty, Name } from "./codegen";
import { _Code } from "./codegen/code";
// TODO refactor to use Set
export function toHash(arr) {
    const hash = {};
    for (const item of arr)
        hash[item] = true;
    return hash;
}
export function alwaysValidSchema(it, schema) {
    if (typeof schema == "boolean")
        return schema;
    if (Object.keys(schema).length === 0)
        return true;
    checkUnknownRules(it, schema);
    return !schemaHasRules(schema, it.self.RULES.all);
}
export function checkUnknownRules(it, schema = it.schema) {
    const { opts, self } = it;
    if (!opts.strictSchema)
        return;
    if (typeof schema === "boolean")
        return;
    const rules = self.RULES.keywords;
    for (const key in schema) {
        if (!rules[key])
            checkStrictMode(it, `unknown keyword: "${key}"`);
    }
}
export function schemaHasRules(schema, rules) {
    if (typeof schema == "boolean")
        return !schema;
    for (const key in schema)
        if (rules[key])
            return true;
    return false;
}
export function schemaHasRulesButRef(schema, RULES) {
    if (typeof schema == "boolean")
        return !schema;
    for (const key in schema)
        if (key !== "$ref" && RULES.all[key])
            return true;
    return false;
}
export function schemaRefOrVal({ topSchemaRef, schemaPath }, schema, keyword, $data) {
    if (!$data) {
        if (typeof schema == "number" || typeof schema == "boolean")
            return schema;
        if (typeof schema == "string")
            return _ `${schema}`;
    }
    return _ `${topSchemaRef}${schemaPath}${getProperty(keyword)}`;
}
export function unescapeFragment(str) {
    return unescapeJsonPointer(decodeURIComponent(str));
}
export function escapeFragment(str) {
    return encodeURIComponent(escapeJsonPointer(str));
}
export function escapeJsonPointer(str) {
    if (typeof str == "number")
        return `${str}`;
    return str.replace(/~/g, "~0").replace(/\//g, "~1");
}
export function unescapeJsonPointer(str) {
    return str.replace(/~1/g, "/").replace(/~0/g, "~");
}
export function eachItem(xs, f) {
    if (Array.isArray(xs)) {
        for (const x of xs)
            f(x);
    }
    else {
        f(xs);
    }
}
function makeMergeEvaluated({ mergeNames, mergeToName, mergeValues, resultToName, }) {
    return (gen, from, to, toName) => {
        const res = to === undefined
            ? from
            : to instanceof Name
                ? (from instanceof Name ? mergeNames(gen, from, to) : mergeToName(gen, from, to), to)
                : from instanceof Name
                    ? (mergeToName(gen, to, from), from)
                    : mergeValues(from, to);
        return toName === Name && !(res instanceof Name) ? resultToName(gen, res) : res;
    };
}
export const mergeEvaluated = {
    props: makeMergeEvaluated({
        mergeNames: (gen, from, to) => gen.if(_ `${to} !== true && ${from} !== undefined`, () => {
            gen.if(_ `${from} === true`, () => gen.assign(to, true), () => gen.assign(to, _ `${to} || {}`).code(_ `Object.assign(${to}, ${from})`));
        }),
        mergeToName: (gen, from, to) => gen.if(_ `${to} !== true`, () => {
            if (from === true) {
                gen.assign(to, true);
            }
            else {
                gen.assign(to, _ `${to} || {}`);
                setEvaluated(gen, to, from);
            }
        }),
        mergeValues: (from, to) => (from === true ? true : Object.assign(Object.assign({}, from), to)),
        resultToName: evaluatedPropsToName,
    }),
    items: makeMergeEvaluated({
        mergeNames: (gen, from, to) => gen.if(_ `${to} !== true && ${from} !== undefined`, () => gen.assign(to, _ `${from} === true ? true : ${to} > ${from} ? ${to} : ${from}`)),
        mergeToName: (gen, from, to) => gen.if(_ `${to} !== true`, () => gen.assign(to, from === true ? true : _ `${to} > ${from} ? ${to} : ${from}`)),
        mergeValues: (from, to) => (from === true ? true : Math.max(from, to)),
        resultToName: (gen, items) => gen.var("items", items),
    }),
};
export function evaluatedPropsToName(gen, ps) {
    if (ps === true)
        return gen.var("props", true);
    const props = gen.var("props", _ `{}`);
    if (ps !== undefined)
        setEvaluated(gen, props, ps);
    return props;
}
export function setEvaluated(gen, props, ps) {
    Object.keys(ps).forEach((p) => gen.assign(_ `${props}${getProperty(p)}`, true));
}
const snippets = {};
export function useFunc(gen, f) {
    return gen.scopeValue("func", {
        ref: f,
        code: snippets[f.code] || (snippets[f.code] = new _Code(f.code)),
    });
}
export var Type;
(function (Type) {
    Type[Type["Num"] = 0] = "Num";
    Type[Type["Str"] = 1] = "Str";
})(Type || (Type = {}));
export function getErrorPath(dataProp, dataPropType, jsPropertySyntax) {
    // let path
    if (dataProp instanceof Name) {
        const isNumber = dataPropType === Type.Num;
        return jsPropertySyntax
            ? isNumber
                ? _ `"[" + ${dataProp} + "]"`
                : _ `"['" + ${dataProp} + "']"`
            : isNumber
                ? _ `"/" + ${dataProp}`
                : _ `"/" + ${dataProp}.replace(/~/g, "~0").replace(/\\//g, "~1")`; // TODO maybe use global escapePointer
    }
    return jsPropertySyntax ? getProperty(dataProp).toString() : "/" + escapeJsonPointer(dataProp);
}
export function checkStrictMode(it, msg, mode = it.opts.strictSchema) {
    if (!mode)
        return;
    msg = `strict mode: ${msg}`;
    if (mode === true)
        throw new Error(msg);
    it.self.logger.warn(msg);
}

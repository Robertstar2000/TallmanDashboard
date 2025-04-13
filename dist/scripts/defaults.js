import { _, getProperty, stringify } from "../codegen";
import { checkStrictMode } from "../util";
export function assignDefaults(it, ty) {
    const { properties, items } = it.schema;
    if (ty === "object" && properties) {
        for (const key in properties) {
            assignDefault(it, key, properties[key].default);
        }
    }
    else if (ty === "array" && Array.isArray(items)) {
        items.forEach((sch, i) => assignDefault(it, i, sch.default));
    }
}
function assignDefault(it, prop, defaultValue) {
    const { gen, compositeRule, data, opts } = it;
    if (defaultValue === undefined)
        return;
    const childData = _ `${data}${getProperty(prop)}`;
    if (compositeRule) {
        checkStrictMode(it, `default is ignored for: ${childData}`);
        return;
    }
    let condition = _ `${childData} === undefined`;
    if (opts.useDefaults === "empty") {
        condition = _ `${condition} || ${childData} === null || ${childData} === ""`;
    }
    // `${childData} === undefined` +
    // (opts.useDefaults === "empty" ? ` || ${childData} === null || ${childData} === ""` : "")
    gen.if(condition, _ `${childData} = ${stringify(defaultValue)}`);
}

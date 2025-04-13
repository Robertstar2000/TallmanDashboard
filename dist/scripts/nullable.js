import { _, not, nil } from "../../compile/codegen";
export function checkNullable({ gen, data, parentSchema }, cond = nil) {
    const valid = gen.name("valid");
    if (parentSchema.nullable) {
        gen.let(valid, _ `${data} === null`);
        cond = not(valid);
    }
    else {
        gen.let(valid, false);
    }
    return [valid, cond];
}
export function checkNullableObject(cxt, cond) {
    const [valid, cond_] = checkNullable(cxt, cond);
    return [valid, _ `${cond_} && typeof ${cxt.data} == "object" && !Array.isArray(${cxt.data})`];
}

import { _ } from "../../compile/codegen";
export function typeError(t) {
    return {
        message: (cxt) => typeErrorMessage(cxt, t),
        params: (cxt) => typeErrorParams(cxt, t),
    };
}
export function typeErrorMessage({ parentSchema }, t) {
    return (parentSchema === null || parentSchema === void 0 ? void 0 : parentSchema.nullable) ? `must be ${t} or null` : `must be ${t}`;
}
export function typeErrorParams({ parentSchema }, t) {
    return _ `{type: ${t}, nullable: ${!!(parentSchema === null || parentSchema === void 0 ? void 0 : parentSchema.nullable)}}`;
}

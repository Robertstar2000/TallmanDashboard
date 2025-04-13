// https://github.com/ajv-validator/ajv/issues/889
import * as equal from "fast-deep-equal";
equal.code = 'require("ajv/dist/runtime/equal").default';
export default equal;

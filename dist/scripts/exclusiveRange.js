import getDef from "../definitions/exclusiveRange";
const exclusiveRange = (ajv) => ajv.addKeyword(getDef());
export default exclusiveRange;
module.exports = exclusiveRange;

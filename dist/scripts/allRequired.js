import getDef from "../definitions/allRequired";
const allRequired = (ajv) => ajv.addKeyword(getDef());
export default allRequired;
module.exports = allRequired;

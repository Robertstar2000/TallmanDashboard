import getDef from "../definitions/deepRequired";
const deepRequired = (ajv) => ajv.addKeyword(getDef());
export default deepRequired;
module.exports = deepRequired;

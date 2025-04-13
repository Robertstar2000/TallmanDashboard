import getDef from "../definitions/patternRequired";
const patternRequired = (ajv) => ajv.addKeyword(getDef());
export default patternRequired;
module.exports = patternRequired;

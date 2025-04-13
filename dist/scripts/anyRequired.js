import getDef from "../definitions/anyRequired";
const anyRequired = (ajv) => ajv.addKeyword(getDef());
export default anyRequired;
module.exports = anyRequired;

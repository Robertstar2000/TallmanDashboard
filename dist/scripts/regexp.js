import getDef from "../definitions/regexp";
const regexp = (ajv) => ajv.addKeyword(getDef());
export default regexp;
module.exports = regexp;

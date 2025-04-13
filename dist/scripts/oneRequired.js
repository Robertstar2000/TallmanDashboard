import getDef from "../definitions/oneRequired";
const oneRequired = (ajv) => ajv.addKeyword(getDef());
export default oneRequired;
module.exports = oneRequired;

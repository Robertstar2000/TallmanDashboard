import getDef from "../definitions/dynamicDefaults";
const dynamicDefaults = (ajv) => ajv.addKeyword(getDef());
export default dynamicDefaults;
module.exports = dynamicDefaults;

import getDef from "../definitions/uniqueItemProperties";
const uniqueItemProperties = (ajv) => ajv.addKeyword(getDef());
export default uniqueItemProperties;
module.exports = uniqueItemProperties;

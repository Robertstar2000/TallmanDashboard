import getDef from "../definitions/deepProperties";
const deepProperties = (ajv, opts) => ajv.addKeyword(getDef(opts));
export default deepProperties;
module.exports = deepProperties;

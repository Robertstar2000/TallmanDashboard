import getDef from "../definitions/transform";
const transform = (ajv) => ajv.addKeyword(getDef());
export default transform;
module.exports = transform;

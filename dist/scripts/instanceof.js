import getDef from "../definitions/instanceof";
const instanceofPlugin = (ajv) => ajv.addKeyword(getDef());
export default instanceofPlugin;
module.exports = instanceofPlugin;

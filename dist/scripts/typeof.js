import getDef from "../definitions/typeof";
const typeofPlugin = (ajv) => ajv.addKeyword(getDef());
export default typeofPlugin;
module.exports = typeofPlugin;

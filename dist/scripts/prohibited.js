import getDef from "../definitions/prohibited";
const prohibited = (ajv) => ajv.addKeyword(getDef());
export default prohibited;
module.exports = prohibited;

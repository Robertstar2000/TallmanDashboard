import getDefs from "../definitions/select";
const select = (ajv, opts) => {
    getDefs(opts).forEach((d) => ajv.addKeyword(d));
    return ajv;
};
export default select;
module.exports = select;

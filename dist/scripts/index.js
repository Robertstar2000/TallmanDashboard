import plugins from "./keywords";
export { AjvKeywordsError } from "./definitions";
const ajvKeywords = (ajv, keyword) => {
    if (Array.isArray(keyword)) {
        for (const k of keyword)
            get(k)(ajv);
        return ajv;
    }
    if (keyword) {
        get(keyword)(ajv);
        return ajv;
    }
    for (keyword in plugins)
        get(keyword)(ajv);
    return ajv;
};
ajvKeywords.get = get;
function get(keyword) {
    const defFunc = plugins[keyword];
    if (!defFunc)
        throw new Error("Unknown keyword " + keyword);
    return defFunc;
}
export default ajvKeywords;
module.exports = ajvKeywords;
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
module.exports.default = ajvKeywords;

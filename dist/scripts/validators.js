const arbitraryValueRegex = /^\[(?:([a-z-]+):)?(.+)\]$/i;
const fractionRegex = /^\d+\/\d+$/;
const stringLengths = new Set(['px', 'full', 'screen']);
const tshirtUnitRegex = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/;
const lengthUnitRegex = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/;
const colorFunctionRegex = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/;
// Shadow always begins with x and y offset separated by underscore optionally prepended by inset
const shadowRegex = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/;
const imageRegex = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/;
export const isLength = (value) => isNumber(value) || stringLengths.has(value) || fractionRegex.test(value);
export const isArbitraryLength = (value) => getIsArbitraryValue(value, 'length', isLengthOnly);
export const isNumber = (value) => Boolean(value) && !Number.isNaN(Number(value));
export const isArbitraryNumber = (value) => getIsArbitraryValue(value, 'number', isNumber);
export const isInteger = (value) => Boolean(value) && Number.isInteger(Number(value));
export const isPercent = (value) => value.endsWith('%') && isNumber(value.slice(0, -1));
export const isArbitraryValue = (value) => arbitraryValueRegex.test(value);
export const isTshirtSize = (value) => tshirtUnitRegex.test(value);
const sizeLabels = new Set(['length', 'size', 'percentage']);
export const isArbitrarySize = (value) => getIsArbitraryValue(value, sizeLabels, isNever);
export const isArbitraryPosition = (value) => getIsArbitraryValue(value, 'position', isNever);
const imageLabels = new Set(['image', 'url']);
export const isArbitraryImage = (value) => getIsArbitraryValue(value, imageLabels, isImage);
export const isArbitraryShadow = (value) => getIsArbitraryValue(value, '', isShadow);
export const isAny = () => true;
const getIsArbitraryValue = (value, label, testValue) => {
    const result = arbitraryValueRegex.exec(value);
    if (result) {
        if (result[1]) {
            return typeof label === 'string' ? result[1] === label : label.has(result[1]);
        }
        return testValue(result[2]);
    }
    return false;
};
const isLengthOnly = (value) => 
// `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
// For example, `hsl(0 0% 0%)` would be classified as a length without this check.
// I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
lengthUnitRegex.test(value) && !colorFunctionRegex.test(value);
const isNever = () => false;
const isShadow = (value) => shadowRegex.test(value);
const isImage = (value) => imageRegex.test(value);

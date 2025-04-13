import { serializeStyles } from '@emotion/serialize';
function css(...args) {
    return serializeStyles(args);
}
export default css;

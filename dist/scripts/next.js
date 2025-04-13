import dependentRequired from "./validation/dependentRequired";
import dependentSchemas from "./applicator/dependentSchemas";
import limitContains from "./validation/limitContains";
const next = [dependentRequired, dependentSchemas, limitContains];
export default next;

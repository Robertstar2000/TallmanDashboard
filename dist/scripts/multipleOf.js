import { _, str } from "../../compile/codegen";
const error = {
    message: ({ schemaCode }) => str `must be multiple of ${schemaCode}`,
    params: ({ schemaCode }) => _ `{multipleOf: ${schemaCode}}`,
};
const def = {
    keyword: "multipleOf",
    type: "number",
    schemaType: "number",
    $data: true,
    error,
    code(cxt) {
        const { gen, data, schemaCode, it } = cxt;
        // const bdt = bad$DataType(schemaCode, <string>def.schemaType, $data)
        const prec = it.opts.multipleOfPrecision;
        const res = gen.let("res");
        const invalid = prec
            ? _ `Math.abs(Math.round(${res}) - ${res}) > 1e-${prec}`
            : _ `${res} !== parseInt(${res})`;
        cxt.fail$data(_ `(${schemaCode} === 0 || (${res} = ${data}/${schemaCode}, ${invalid}))`);
    },
};
export default def;

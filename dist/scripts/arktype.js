import { toNestErrors, validateFieldsNatively } from '@hookform/resolvers';
import { ArkErrors } from 'arktype';
const parseErrorSchema = (e) => {
    // copy code to type to match FieldError shape
    e.forEach((e) => Object.assign(e, { type: e.code }));
    // need to cast here because TS doesn't understand we added the type field
    return e.byPath;
};
export const arktypeResolver = (schema, _schemaOptions, resolverOptions = {}) => (values, _, options) => {
    const out = schema(values);
    if (out instanceof ArkErrors) {
        return {
            values: {},
            errors: toNestErrors(parseErrorSchema(out), options),
        };
    }
    options.shouldUseNativeValidation && validateFieldsNatively({}, options);
    return {
        errors: {},
        values: resolverOptions.raw ? values : out,
    };
};

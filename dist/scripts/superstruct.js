import { toNestErrors, validateFieldsNatively } from '@hookform/resolvers';
import { validate } from 'superstruct';
const parseErrorSchema = (error) => error.failures().reduce((previous, error) => (previous[error.path.join('.')] = {
    message: error.message,
    type: error.type,
}) && previous, {});
export const superstructResolver = (schema, schemaOptions, resolverOptions = {}) => (values, _, options) => {
    const result = validate(values, schema, schemaOptions);
    if (result[0]) {
        return {
            values: {},
            errors: toNestErrors(parseErrorSchema(result[0]), options),
        };
    }
    options.shouldUseNativeValidation && validateFieldsNatively({}, options);
    return {
        values: resolverOptions.raw ? values : result[1],
        errors: {},
    };
};

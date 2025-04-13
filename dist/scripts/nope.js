import { toNestErrors, validateFieldsNatively } from '@hookform/resolvers';
const parseErrors = (errors, parsedErrors = {}, path = '') => {
    return Object.keys(errors).reduce((acc, key) => {
        const _path = path ? `${path}.${key}` : key;
        const error = errors[key];
        if (typeof error === 'string') {
            acc[_path] = {
                message: error,
            };
        }
        else {
            parseErrors(error, acc, _path);
        }
        return acc;
    }, parsedErrors);
};
export const nopeResolver = (schema, schemaOptions = {
    abortEarly: false,
}) => (values, context, options) => {
    const result = schema.validate(values, context, schemaOptions);
    if (result) {
        return { values: {}, errors: toNestErrors(parseErrors(result), options) };
    }
    options.shouldUseNativeValidation && validateFieldsNatively({}, options);
    return { values, errors: {} };
};

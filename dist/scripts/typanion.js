import { toNestErrors, validateFieldsNatively } from '@hookform/resolvers';
const parseErrors = (errors, parsedErrors = {}) => {
    return errors.reduce((acc, error) => {
        const fieldIndex = error.indexOf(':');
        const field = error.slice(1, fieldIndex);
        const message = error.slice(fieldIndex + 1).trim();
        acc[field] = {
            message,
        };
        return acc;
    }, parsedErrors);
};
export const typanionResolver = (validator, validatorOptions = {}) => (values, _, options) => {
    const rawErrors = [];
    const isValid = validator(values, Object.assign({}, {
        errors: rawErrors,
    }, validatorOptions));
    const parsedErrors = parseErrors(rawErrors);
    if (isValid) {
        options.shouldUseNativeValidation &&
            validateFieldsNatively(parsedErrors, options);
        return { values, errors: {} };
    }
    return { values: {}, errors: toNestErrors(parsedErrors, options) };
};

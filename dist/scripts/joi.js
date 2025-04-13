var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { toNestErrors, validateFieldsNatively } from '@hookform/resolvers';
import { appendErrors } from 'react-hook-form';
const parseErrorSchema = (error, validateAllFieldCriteria) => error.details.length
    ? error.details.reduce((previous, error) => {
        const _path = error.path.join('.');
        if (!previous[_path]) {
            previous[_path] = { message: error.message, type: error.type };
        }
        if (validateAllFieldCriteria) {
            const types = previous[_path].types;
            const messages = types && types[error.type];
            previous[_path] = appendErrors(_path, validateAllFieldCriteria, previous, error.type, messages
                ? [].concat(messages, error.message)
                : error.message);
        }
        return previous;
    }, {})
    : {};
export const joiResolver = (schema, schemaOptions = {
    abortEarly: false,
}, resolverOptions = {}) => (values, context, options) => __awaiter(void 0, void 0, void 0, function* () {
    const _schemaOptions = Object.assign({}, schemaOptions, {
        context,
    });
    let result = {};
    if (resolverOptions.mode === 'sync') {
        result = schema.validate(values, _schemaOptions);
    }
    else {
        try {
            result.value = yield schema.validateAsync(values, _schemaOptions);
        }
        catch (e) {
            result.error = e;
        }
    }
    if (result.error) {
        return {
            values: {},
            errors: toNestErrors(parseErrorSchema(result.error, !options.shouldUseNativeValidation &&
                options.criteriaMode === 'all'), options),
        };
    }
    options.shouldUseNativeValidation && validateFieldsNatively({}, options);
    return {
        errors: {},
        values: result.value,
    };
});

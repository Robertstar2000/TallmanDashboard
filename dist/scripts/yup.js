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
import { appendErrors, } from 'react-hook-form';
/**
 * Why `path!` ? because it could be `undefined` in some case
 * https://github.com/jquense/yup#validationerrorerrors-string--arraystring-value-any-path-string
 */
const parseErrorSchema = (error, validateAllFieldCriteria) => {
    return (error.inner || []).reduce((previous, error) => {
        if (!previous[error.path]) {
            previous[error.path] = { message: error.message, type: error.type };
        }
        if (validateAllFieldCriteria) {
            const types = previous[error.path].types;
            const messages = types && types[error.type];
            previous[error.path] = appendErrors(error.path, validateAllFieldCriteria, previous, error.type, messages
                ? [].concat(messages, error.message)
                : error.message);
        }
        return previous;
    }, {});
};
export function yupResolver(schema, schemaOptions = {}, resolverOptions = {}) {
    return (values, context, options) => __awaiter(this, void 0, void 0, function* () {
        try {
            if (schemaOptions.context && process.env.NODE_ENV === 'development') {
                // eslint-disable-next-line no-console
                console.warn("You should not used the yup options context. Please, use the 'useForm' context object instead");
            }
            const result = yield schema[resolverOptions.mode === 'sync' ? 'validateSync' : 'validate'](values, Object.assign({ abortEarly: false }, schemaOptions, { context }));
            options.shouldUseNativeValidation && validateFieldsNatively({}, options);
            return {
                values: resolverOptions.raw ? values : result,
                errors: {},
            };
        }
        catch (e) {
            if (!e.inner) {
                throw e;
            }
            return {
                values: {},
                errors: toNestErrors(parseErrorSchema(e, !options.shouldUseNativeValidation &&
                    options.criteriaMode === 'all'), options),
            };
        }
    });
}

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
const isZodError = (error) => Array.isArray(error === null || error === void 0 ? void 0 : error.errors);
const parseErrorSchema = (zodErrors, validateAllFieldCriteria) => {
    const errors = {};
    for (; zodErrors.length;) {
        const error = zodErrors[0];
        const { code, message, path } = error;
        const _path = path.join('.');
        if (!errors[_path]) {
            if ('unionErrors' in error) {
                const unionError = error.unionErrors[0].errors[0];
                errors[_path] = {
                    message: unionError.message,
                    type: unionError.code,
                };
            }
            else {
                errors[_path] = { message, type: code };
            }
        }
        if ('unionErrors' in error) {
            error.unionErrors.forEach((unionError) => unionError.errors.forEach((e) => zodErrors.push(e)));
        }
        if (validateAllFieldCriteria) {
            const types = errors[_path].types;
            const messages = types && types[error.code];
            errors[_path] = appendErrors(_path, validateAllFieldCriteria, errors, code, messages
                ? [].concat(messages, error.message)
                : error.message);
        }
        zodErrors.shift();
    }
    return errors;
};
export const zodResolver = (schema, schemaOptions, resolverOptions = {}) => (values, _, options) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield schema[resolverOptions.mode === 'sync' ? 'parse' : 'parseAsync'](values, schemaOptions);
        options.shouldUseNativeValidation && validateFieldsNatively({}, options);
        return {
            errors: {},
            values: resolverOptions.raw ? values : data,
        };
    }
    catch (error) {
        if (isZodError(error)) {
            return {
                values: {},
                errors: toNestErrors(parseErrorSchema(error.errors, !options.shouldUseNativeValidation &&
                    options.criteriaMode === 'all'), options),
            };
        }
        throw error;
    }
});

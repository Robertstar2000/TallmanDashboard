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
import { validate } from '@typeschema/main';
import { appendErrors } from 'react-hook-form';
const parseErrorSchema = (typeschemaErrors, validateAllFieldCriteria) => {
    const errors = {};
    for (; typeschemaErrors.length;) {
        const error = typeschemaErrors[0];
        if (!error.path) {
            continue;
        }
        const _path = error.path.join('.');
        if (!errors[_path]) {
            errors[_path] = { message: error.message, type: '' };
        }
        if (validateAllFieldCriteria) {
            const types = errors[_path].types;
            const messages = types && types[''];
            errors[_path] = appendErrors(_path, validateAllFieldCriteria, errors, '', messages
                ? [].concat(messages, error.message)
                : error.message);
        }
        typeschemaErrors.shift();
    }
    return errors;
};
export const typeschemaResolver = (schema, _, resolverOptions = {}) => (values, _, options) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield validate(schema, values);
    options.shouldUseNativeValidation && validateFieldsNatively({}, options);
    if (result.success) {
        return {
            errors: {},
            values: resolverOptions.raw ? values : result.data,
        };
    }
    return {
        values: {},
        errors: toNestErrors(parseErrorSchema(result.issues, !options.shouldUseNativeValidation && options.criteriaMode === 'all'), options),
    };
});

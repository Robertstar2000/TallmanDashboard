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
import { TypeCheck } from '@sinclair/typebox/compiler';
import { Value } from '@sinclair/typebox/value';
import { appendErrors } from 'react-hook-form';
const parseErrorSchema = (_errors, validateAllFieldCriteria) => {
    const errors = {};
    for (; _errors.length;) {
        const error = _errors[0];
        const { type, message, path } = error;
        const _path = path.substring(1).replace(/\//g, '.');
        if (!errors[_path]) {
            errors[_path] = { message, type: '' + type };
        }
        if (validateAllFieldCriteria) {
            const types = errors[_path].types;
            const messages = types && types['' + type];
            errors[_path] = appendErrors(_path, validateAllFieldCriteria, errors, '' + type, messages
                ? [].concat(messages, error.message)
                : error.message);
        }
        _errors.shift();
    }
    return errors;
};
export const typeboxResolver = (schema) => (values, _, options) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = Array.from(schema instanceof TypeCheck
        ? schema.Errors(values)
        : Value.Errors(schema, values));
    options.shouldUseNativeValidation && validateFieldsNatively({}, options);
    if (!errors.length) {
        return {
            errors: {},
            values,
        };
    }
    return {
        values: {},
        errors: toNestErrors(parseErrorSchema(errors, !options.shouldUseNativeValidation && options.criteriaMode === 'all'), options),
    };
});

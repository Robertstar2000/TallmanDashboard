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
import promisify from 'vest/promisify';
const parseErrorSchema = (vestError, validateAllFieldCriteria) => {
    const errors = {};
    for (const path in vestError) {
        if (!errors[path]) {
            errors[path] = { message: vestError[path][0], type: '' };
        }
        if (validateAllFieldCriteria) {
            errors[path].types = vestError[path].reduce((acc, message, index) => (acc[index] = message) && acc, {});
        }
    }
    return errors;
};
export const vestResolver = (schema, _, resolverOptions = {}) => (values, context, options) => __awaiter(void 0, void 0, void 0, function* () {
    const result = resolverOptions.mode === 'sync'
        ? schema(values, options.names, context)
        : yield promisify(schema)(values, options.names, context);
    if (result.hasErrors()) {
        return {
            values: {},
            errors: toNestErrors(parseErrorSchema(result.getErrors(), !options.shouldUseNativeValidation &&
                options.criteriaMode === 'all'), options),
        };
    }
    options.shouldUseNativeValidation && validateFieldsNatively({}, options);
    return { values, errors: {} };
});

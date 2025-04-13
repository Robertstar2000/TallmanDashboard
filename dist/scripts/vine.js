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
import { errors } from '@vinejs/vine';
import { appendErrors } from 'react-hook-form';
const parseErrorSchema = (vineErrors, validateAllFieldCriteria) => {
    const schemaErrors = {};
    for (; vineErrors.length;) {
        const error = vineErrors[0];
        const path = error.field;
        if (!(path in schemaErrors)) {
            schemaErrors[path] = { message: error.message, type: error.rule };
        }
        if (validateAllFieldCriteria) {
            const { types } = schemaErrors[path];
            const messages = types && types[error.rule];
            schemaErrors[path] = appendErrors(path, validateAllFieldCriteria, schemaErrors, error.rule, messages ? [...messages, error.message] : error.message);
        }
        vineErrors.shift();
    }
    return schemaErrors;
};
export const vineResolver = (schema, schemaOptions, resolverOptions = {}) => (values, _, options) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield schema.validate(values, schemaOptions);
        options.shouldUseNativeValidation && validateFieldsNatively({}, options);
        return {
            errors: {},
            values: resolverOptions.raw ? values : data,
        };
    }
    catch (error) {
        if (error instanceof errors.E_VALIDATION_ERROR) {
            return {
                values: {},
                errors: toNestErrors(parseErrorSchema(error.messages, !options.shouldUseNativeValidation &&
                    options.criteriaMode === 'all'), options),
            };
        }
        throw error;
    }
});

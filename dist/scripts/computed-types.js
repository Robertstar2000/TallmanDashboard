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
const isValidationError = (error) => error.errors != null;
const parseErrorSchema = (computedTypesError) => {
    const parsedErrors = {};
    return (computedTypesError.errors || []).reduce((acc, error) => {
        acc[error.path.join('.')] = {
            type: error.error.name,
            message: error.error.message,
        };
        return acc;
    }, parsedErrors);
};
export const computedTypesResolver = (schema) => (values, _, options) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield schema(values);
        options.shouldUseNativeValidation && validateFieldsNatively({}, options);
        return {
            errors: {},
            values: data,
        };
    }
    catch (error) {
        if (isValidationError(error)) {
            return {
                values: {},
                errors: toNestErrors(parseErrorSchema(error), options),
            };
        }
        throw error;
    }
});

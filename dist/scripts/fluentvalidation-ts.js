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
function traverseObject(object, errors, parentIndices = []) {
    for (const key in object) {
        const currentIndex = [...parentIndices, key];
        const currentValue = object[key];
        if (Array.isArray(currentValue)) {
            currentValue.forEach((item, index) => {
                traverseObject(item, errors, [...currentIndex, index]);
            });
        }
        else if (typeof currentValue === 'object' && currentValue !== null) {
            traverseObject(currentValue, errors, currentIndex);
        }
        else if (typeof currentValue === 'string') {
            errors[currentIndex.join('.')] = {
                type: 'validation',
                message: currentValue,
            };
        }
    }
}
const parseErrorSchema = (validationErrors, validateAllFieldCriteria) => {
    if (validateAllFieldCriteria) {
        // TODO: check this but i think its always one validation error
    }
    const errors = {};
    traverseObject(validationErrors, errors);
    return errors;
};
export function fluentValidationResolver(validator) {
    return (values, _context, options) => __awaiter(this, void 0, void 0, function* () {
        const validationResult = validator.validate(values);
        const isValid = Object.keys(validationResult).length === 0;
        options.shouldUseNativeValidation && validateFieldsNatively({}, options);
        return isValid
            ? {
                values: values,
                errors: {},
            }
            : {
                values: {},
                errors: toNestErrors(parseErrorSchema(validationResult, !options.shouldUseNativeValidation &&
                    options.criteriaMode === 'all'), options),
            };
    });
}
export function fluentAsyncValidationResolver(validator) {
    return (values, _context, options) => __awaiter(this, void 0, void 0, function* () {
        const validationResult = yield validator.validateAsync(values);
        const isValid = Object.keys(validationResult).length === 0;
        options.shouldUseNativeValidation && validateFieldsNatively({}, options);
        return isValid
            ? {
                values: values,
                errors: {},
            }
            : {
                values: {},
                errors: toNestErrors(parseErrorSchema(validationResult, !options.shouldUseNativeValidation &&
                    options.criteriaMode === 'all'), options),
            };
    });
}

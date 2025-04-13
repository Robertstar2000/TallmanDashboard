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
import { plainToClass } from 'class-transformer';
import { validate, validateSync } from 'class-validator';
const parseErrors = (errors, validateAllFieldCriteria, parsedErrors = {}, path = '') => {
    return errors.reduce((acc, error) => {
        const _path = path ? `${path}.${error.property}` : error.property;
        if (error.constraints) {
            const key = Object.keys(error.constraints)[0];
            acc[_path] = {
                type: key,
                message: error.constraints[key],
            };
            const _e = acc[_path];
            if (validateAllFieldCriteria && _e) {
                Object.assign(_e, { types: error.constraints });
            }
        }
        if (error.children && error.children.length) {
            parseErrors(error.children, validateAllFieldCriteria, acc, _path);
        }
        return acc;
    }, parsedErrors);
};
export const classValidatorResolver = (schema, schemaOptions = {}, resolverOptions = {}) => (values, _, options) => __awaiter(void 0, void 0, void 0, function* () {
    const { transformer, validator } = schemaOptions;
    const data = plainToClass(schema, values, transformer);
    const rawErrors = yield (resolverOptions.mode === 'sync'
        ? validateSync
        : validate)(data, validator);
    if (rawErrors.length) {
        return {
            values: {},
            errors: toNestErrors(parseErrors(rawErrors, !options.shouldUseNativeValidation &&
                options.criteriaMode === 'all'), options),
        };
    }
    options.shouldUseNativeValidation && validateFieldsNatively({}, options);
    return {
        values: resolverOptions.rawValues ? values : data,
        errors: {},
    };
});

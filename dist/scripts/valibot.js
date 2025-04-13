var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { toNestErrors } from '@hookform/resolvers';
import { appendErrors } from 'react-hook-form';
import { getDotPath, safeParseAsync } from 'valibot';
export const valibotResolver = (schema, schemaOptions, resolverOptions = {}) => (values, _, options) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if we should validate all field criteria
    const validateAllFieldCriteria = !options.shouldUseNativeValidation && options.criteriaMode === 'all';
    // Parse values with Valibot schema
    const result = yield safeParseAsync(schema, values, Object.assign({}, schemaOptions, {
        abortPipeEarly: !validateAllFieldCriteria,
    }));
    // If there are issues, return them as errors
    if (result.issues) {
        // Create errors object
        const errors = {};
        // Iterate over issues to add them to errors object
        for (; result.issues.length;) {
            const issue = result.issues[0];
            // Create dot path from issue
            const path = getDotPath(issue);
            if (path) {
                // Add first error of path to errors object
                if (!errors[path]) {
                    errors[path] = { message: issue.message, type: issue.type };
                }
                // If configured, add all errors of path to errors object
                if (validateAllFieldCriteria) {
                    const types = errors[path].types;
                    const messages = types && types[issue.type];
                    errors[path] = appendErrors(path, validateAllFieldCriteria, errors, issue.type, messages
                        ? [].concat(messages, issue.message)
                        : issue.message);
                }
            }
            result.issues.shift();
        }
        // Return resolver result with errors
        return {
            values: {},
            errors: toNestErrors(errors, options),
        };
    }
    // Otherwise, return resolver result with values
    return {
        values: resolverOptions.raw ? values : result.output,
        errors: {},
    };
});

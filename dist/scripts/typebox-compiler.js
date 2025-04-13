var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { TypeCompiler } from '@sinclair/typebox/compiler';
import { typeboxResolver } from '..';
import { fields, invalidData, schema, validData } from './__fixtures__/data';
const shouldUseNativeValidation = false;
describe('typeboxResolver (with compiler)', () => {
    const typecheck = TypeCompiler.Compile(schema);
    it('should return a single error from typeboxResolver when validation fails', () => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield typeboxResolver(typecheck)(invalidData, undefined, {
            fields,
            shouldUseNativeValidation,
        });
        expect(result).toMatchSnapshot();
    }));
    it('should return all the errors from typeboxResolver when validation fails with `validateAllFieldCriteria` set to true', () => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield typeboxResolver(typecheck)(invalidData, undefined, {
            fields,
            criteriaMode: 'all',
            shouldUseNativeValidation,
        });
        expect(result).toMatchSnapshot();
    }));
    it('should validate with success', () => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield typeboxResolver(typecheck)(validData, undefined, {
            fields,
            shouldUseNativeValidation,
        });
        expect(result).toEqual({ errors: {}, values: validData });
    }));
});

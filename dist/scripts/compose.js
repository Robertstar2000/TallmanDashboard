var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import moize from '../src';
const foo = 'foo';
const bar = 'bar';
const method = jest.fn(function (one, two) {
    return { one, two };
});
describe('moize.compose', () => {
    it('should compose the moize methods into a new method with options combined', () => __awaiter(void 0, void 0, void 0, function* () {
        const maxSize = moize.maxSize(5);
        const maxAge = moize.maxAge(500);
        const serialize = moize.serialize;
        const composedMoizer = moize.compose(maxSize, maxAge, serialize);
        const composed = composedMoizer(method);
        expect(composed.options).toEqual(expect.objectContaining({
            maxAge: 500,
            maxSize: 5,
            isSerialized: true,
        }));
        composed(foo, bar);
        expect(composed.cache.keys).toEqual([['|foo|bar|']]);
        yield new Promise((resolve) => setTimeout(resolve, 1000));
        expect(composed.cache.size).toBe(0);
    }));
});

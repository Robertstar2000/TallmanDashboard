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
function method(one, two) {
    return [one, two];
}
const foo = 'foo';
const bar = 'bar';
describe('moize.maxAge', () => {
    it('removes the item from cache after the time passed', () => __awaiter(void 0, void 0, void 0, function* () {
        const memoized = moize.maxAge(1000)(method, {
            onExpire: jest.fn(),
        });
        memoized(foo, bar);
        expect(memoized.has([foo, bar])).toBe(true);
        expect(memoized.options.onExpire).not.toHaveBeenCalled();
        yield new Promise((resolve) => setTimeout(resolve, 1500));
        expect(memoized.has([foo, bar])).toBe(false);
        expect(memoized.options.onExpire).toHaveBeenCalled();
    }));
    it('notifies of cache change on removal if onCacheChange', () => __awaiter(void 0, void 0, void 0, function* () {
        const memoized = moize.maxAge(1000)(method, {
            onCacheChange: jest.fn(),
        });
        memoized(foo, bar);
        expect(memoized.has([foo, bar])).toBe(true);
        yield new Promise((resolve) => setTimeout(resolve, 1500));
        expect(memoized.has([foo, bar])).toBe(false);
        expect(memoized.options.onCacheChange).toHaveBeenCalledWith(memoized.cache, memoized.options, memoized);
    }));
    it('updates the expiration when called and cache is hit', () => __awaiter(void 0, void 0, void 0, function* () {
        const withUpdateExpire = moize.maxAge(1000, true)(method);
        withUpdateExpire(foo, bar);
        setTimeout(() => {
            expect(withUpdateExpire.has([foo, bar])).toBe(true);
        }, 1000);
        yield new Promise((resolve) => setTimeout(resolve, 700));
        withUpdateExpire(foo, bar);
        expect(withUpdateExpire.has([foo, bar])).toBe(true);
        yield new Promise((resolve) => setTimeout(resolve, 1500));
        expect(withUpdateExpire.has([foo, bar])).toBe(false);
    }));
    it('calls the onExpire method when the item is removed from cache', () => __awaiter(void 0, void 0, void 0, function* () {
        const onExpire = jest.fn();
        const withOnExpire = moize.maxAge(1000, onExpire)(method);
        withOnExpire(foo, bar);
        expect(withOnExpire.has([foo, bar])).toBe(true);
        expect(withOnExpire.options.onExpire).not.toHaveBeenCalled();
        yield new Promise((resolve) => setTimeout(resolve, 1500));
        expect(withOnExpire.has([foo, bar])).toBe(false);
        expect(withOnExpire.options.onExpire).toHaveBeenCalledTimes(1);
    }));
    it('updates the expiration timing and calls the onExpire method when the item is removed from cache', () => __awaiter(void 0, void 0, void 0, function* () {
        const onExpire = jest.fn();
        const withExpireOptions = moize.maxAge(1000, {
            onExpire,
            updateExpire: true,
        })(method);
        withExpireOptions(foo, bar);
        setTimeout(() => {
            expect(withExpireOptions.has([foo, bar])).toBe(true);
        }, 1000);
        yield new Promise((resolve) => setTimeout(resolve, 700));
        withExpireOptions(foo, bar);
        yield new Promise((resolve) => setTimeout(resolve, 1500));
        expect(withExpireOptions.has([foo, bar])).toBe(false);
        expect(withExpireOptions.options.onExpire).toHaveBeenCalledTimes(1);
    }));
    it('allows the expiration to be re-established if onExpire returns false', () => __awaiter(void 0, void 0, void 0, function* () {
        const onExpire = jest
            .fn()
            .mockReturnValueOnce(false)
            .mockReturnValue(true);
        const withOnExpire = moize.maxAge(1000, onExpire)(method);
        withOnExpire(foo, bar);
        expect(withOnExpire.has([foo, bar])).toBe(true);
        expect(withOnExpire.options.onExpire).not.toHaveBeenCalled();
        yield new Promise((resolve) => setTimeout(resolve, 1100));
        expect(withOnExpire.has([foo, bar])).toBe(true);
        expect(withOnExpire.options.onExpire).toHaveBeenCalledTimes(1);
        yield new Promise((resolve) => setTimeout(resolve, 1100));
        expect(withOnExpire.has([foo, bar])).toBe(false);
        expect(withOnExpire.options.onExpire).toHaveBeenCalledTimes(2);
    }));
    it('notifies of cache change when expiration re-established if onCacheChange', () => __awaiter(void 0, void 0, void 0, function* () {
        const onExpire = jest
            .fn()
            .mockReturnValueOnce(false)
            .mockReturnValue(true);
        const withOnExpire = moize.maxAge(1000, onExpire)(method, {
            onCacheChange: jest.fn(),
        });
        withOnExpire(foo, bar);
        expect(withOnExpire.has([foo, bar])).toBe(true);
        expect(withOnExpire.options.onExpire).not.toHaveBeenCalled();
        yield new Promise((resolve) => setTimeout(resolve, 1100));
        expect(withOnExpire.has([foo, bar])).toBe(true);
        expect(withOnExpire.options.onExpire).toHaveBeenCalledTimes(1);
        yield new Promise((resolve) => setTimeout(resolve, 1100));
        expect(withOnExpire.has([foo, bar])).toBe(false);
        expect(withOnExpire.options.onExpire).toHaveBeenCalledTimes(2);
        expect(withOnExpire.options.onCacheChange).toHaveBeenCalledWith(withOnExpire.cache, withOnExpire.options, withOnExpire);
    }));
});

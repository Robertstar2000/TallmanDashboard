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
const method = (one, two) => one + two.number;
const promiseMethodResolves = (one, two) => new Promise((resolve) => setTimeout(() => resolve(one + two.number), 1000));
const promiseMethodRejects = 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
(one, two) => new Promise((resolve, reject) => setTimeout(() => reject(new Error('boom')), 1000));
describe('moize.updateCacheForKey', () => {
    describe('success', () => {
        it('will refresh the cache', () => {
            const moized = moize.maxSize(2)(method, {
                updateCacheForKey(args) {
                    return args[1].number % 2 === 0;
                },
            });
            const mutated = { number: 5 };
            const result = moized(6, mutated);
            expect(result).toBe(11);
            mutated.number = 11;
            const mutatedResult = moized(6, mutated);
            // Result was not recalculated because `updateCacheForKey` returned `false` and the values are
            // seen as unchanged.
            expect(mutatedResult).toBe(result);
            mutated.number = 10;
            const refreshedResult = moized(6, mutated);
            // Result was recalculated because `updateCacheForKey` returned `true`.
            expect(refreshedResult).not.toBe(result);
            expect(refreshedResult).toBe(16);
            const { keys, values } = moized.cacheSnapshot;
            expect(keys).toEqual([[6, mutated]]);
            expect(values).toEqual([16]);
        });
        it('will refresh the cache based on external values', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockMethod = jest.fn(method);
            let lastUpdate = Date.now();
            const moized = moize.maxSize(2)(mockMethod, {
                updateCacheForKey() {
                    const now = Date.now();
                    const last = lastUpdate;
                    lastUpdate = now;
                    return last + 1000 < now;
                },
            });
            const mutated = { number: 5 };
            moized(6, mutated);
            moized(6, mutated);
            moized(6, mutated);
            expect(mockMethod).toHaveBeenCalledTimes(1);
            yield new Promise((resolve) => setTimeout(resolve, 2000));
            moized(6, mutated);
            expect(mockMethod).toHaveBeenCalledTimes(2);
        }));
        it('will refresh the cache when used with promises', () => __awaiter(void 0, void 0, void 0, function* () {
            const moized = moize.maxSize(2)(promiseMethodResolves, {
                isPromise: true,
                updateCacheForKey(args) {
                    return args[1].number % 2 === 0;
                },
            });
            const mutated = { number: 5 };
            const result = yield moized(6, mutated);
            expect(result).toBe(11);
            mutated.number = 11;
            const mutatedResult = yield moized(6, mutated);
            // Result was not recalculated because `updateCacheForKey` returned `false` and the values are
            // seen as unchanged.
            expect(mutatedResult).toBe(result);
            mutated.number = 10;
            const refreshedResult = yield moized(6, mutated);
            // Result was recalculated because `updateCacheForKey` returned `true`.
            expect(refreshedResult).not.toBe(result);
            expect(refreshedResult).toBe(16);
            const { keys, values } = moized.cacheSnapshot;
            expect(keys).toEqual([[6, mutated]]);
            expect(values).toEqual([Promise.resolve(16)]);
        }));
        it('will refresh the cache when used with custom key transformers', () => {
            let count = 0;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const increment = (_) => ++count;
            const moized = moize.maxSize(2)(increment, {
                isSerialized: true,
                updateCacheForKey: (args) => args[0] && args[0].force === true,
                serializer: () => ['always same'],
            });
            expect(moized()).toBe(1);
            expect(moized()).toBe(1);
            expect(moized({ force: true })).toBe(2);
            expect(moized()).toBe(2);
        });
        it('will refresh the cache with shorthand', () => {
            const moized = moize.updateCacheForKey((args) => args[1].number % 2 === 0)(method);
            const mutated = { number: 5 };
            const result = moized(6, mutated);
            expect(result).toBe(11);
            mutated.number = 11;
            const mutatedResult = moized(6, mutated);
            // Result was not recalculated because `updateCacheForKey` returned `false` and the values are
            // seen as unchanged.
            expect(mutatedResult).toBe(result);
            mutated.number = 10;
            const refreshedResult = moized(6, mutated);
            // Result was recalculated because `updateCacheForKey` returned `true`.
            expect(refreshedResult).not.toBe(result);
            expect(refreshedResult).toBe(16);
            const { keys, values } = moized.cacheSnapshot;
            expect(keys).toEqual([[6, mutated]]);
            expect(values).toEqual([16]);
        });
        it('will refresh the cache with composed shorthand', () => {
            const moizer = moize.compose(moize.maxSize(2), moize.updateCacheForKey((args) => args[1].number % 2 === 0));
            const moized = moizer(method);
            const mutated = { number: 5 };
            const result = moized(6, mutated);
            expect(result).toBe(11);
            mutated.number = 11;
            const mutatedResult = moized(6, mutated);
            // Result was not recalculated because `updateCacheForKey` returned `false` and the values are
            // seen as unchanged.
            expect(mutatedResult).toBe(result);
            mutated.number = 10;
            const refreshedResult = moized(6, mutated);
            // Result was recalculated because `updateCacheForKey` returned `true`.
            expect(refreshedResult).not.toBe(result);
            expect(refreshedResult).toBe(16);
            const { keys, values } = moized.cacheSnapshot;
            expect(keys).toEqual([[6, mutated]]);
            expect(values).toEqual([16]);
        });
    });
    describe('fail', () => {
        it('surfaces the error if the function fails', () => {
            const moized = moize.maxSize(2)(
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            (_1, _2) => {
                throw new Error('boom');
            }, {
                updateCacheForKey(args) {
                    return args[1].number % 2 === 0;
                },
            });
            const mutated = { number: 5 };
            expect(() => moized(6, mutated)).toThrow(new Error('boom'));
        });
        it('surfaces the error if the promise rejects', () => __awaiter(void 0, void 0, void 0, function* () {
            const moized = moize.maxSize(2)(promiseMethodRejects, {
                isPromise: true,
                updateCacheForKey(args) {
                    return args[1].number % 2 === 0;
                },
            });
            const mutated = { number: 5 };
            yield expect(moized(6, mutated)).rejects.toEqual(new Error('boom'));
        }));
        it('should have nothing in cache if promise is rejected and key was never present', () => __awaiter(void 0, void 0, void 0, function* () {
            const moized = moize.maxSize(2)(promiseMethodRejects, {
                isPromise: true,
                updateCacheForKey(args) {
                    return args[1].number % 2 === 0;
                },
            });
            const mutated = { number: 5 };
            yield expect(moized(6, mutated)).rejects.toEqual(new Error('boom'));
            expect(moized.keys()).toEqual([]);
            expect(moized.values()).toEqual([]);
        }));
        // For some reason, this is causing `jest` to crash instead of handle the rejection
        it.skip('should have nothing in cache if promise is rejected and key was present', () => __awaiter(void 0, void 0, void 0, function* () {
            const moized = moize.maxSize(2)(promiseMethodRejects, {
                isPromise: true,
                updateCacheForKey(args) {
                    return args[1].number % 2 === 0;
                },
            });
            const mutated = { number: 5 };
            moized.set([6, mutated], Promise.resolve(11));
            expect(moized.get([6, mutated])).toEqual(Promise.resolve(11));
            mutated.number = 10;
            yield expect(moized(6, mutated)).rejects.toEqual(new Error('boom'));
            expect(moized.keys()).toEqual([]);
            expect(moized.values()).toEqual([]);
        }));
    });
    describe('infrastructure', () => {
        it('should have all the static properties of a standard moized method', () => {
            const moized = moize.maxSize(2)(promiseMethodResolves, {
                updateCacheForKey(args) {
                    return args[1].number % 2 === 0;
                },
            });
            const standardMoized = moize.maxSize(2)(promiseMethodResolves);
            expect(Object.getOwnPropertyNames(moized)).toEqual(Object.getOwnPropertyNames(standardMoized));
        });
    });
    describe('edge cases', () => {
        it('should retain the original function name', () => {
            function myNamedFunction() { }
            const memoized = moize(myNamedFunction, {
                updateCacheForKey: () => false,
            });
            expect(memoized.name).toBe('moized(myNamedFunction)');
        });
    });
});

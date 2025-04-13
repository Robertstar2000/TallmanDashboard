var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Bluebird from 'bluebird';
import moize from '../src';
function createMethod(type, method, PromiseLibrary) {
    if (method === 'reject') {
        return function (number, otherNumber) {
            return PromiseLibrary.reject(new Error(`rejected ${number * otherNumber}`));
        };
    }
    return function (number, otherNumber) {
        return PromiseLibrary.resolve(number * otherNumber);
    };
}
const bluebirdMemoizedResolve = moize.promise(createMethod('bluebird', 'resolve', Bluebird), { profileName: 'bluebird (reject)' });
const bluebirdMemoizedReject = moize.promise(createMethod('bluebird', 'reject', Bluebird), { profileName: 'bluebird (reject)' });
const bluebirdMemoizedExpiring = moize.promise(createMethod('native', 'resolve', Bluebird), {
    maxAge: 1500,
    onCacheHit: jest.fn(),
    onExpire: jest.fn(),
    profileName: 'bluebird (expiring)',
});
const nativeMemoizedResolve = moize.promise(createMethod('native', 'resolve', Promise), {
    profileName: 'native',
});
const nativeMemoizedReject = moize.promise(createMethod('native', 'reject', Promise), {
    profileName: 'native (reject)',
});
const nativeMemoizedExpiring = moize.promise(createMethod('native', 'resolve', Promise), {
    maxAge: 1500,
    onCacheHit: jest.fn(),
    onExpire: jest.fn(),
    profileName: 'native (expiring)',
});
function testItem(key, method, Constructor) {
    const [number, otherNumber] = key;
    return method(number, otherNumber).then((result) => {
        expect(method.get(key)).toBeInstanceOf(Constructor);
        expect(method.get(key.slice().reverse())).toBe(undefined);
        expect(result).toEqual(number * otherNumber);
    });
}
const TYPES = {
    bluebird: Bluebird,
    native: Promise,
};
const METHODS = {
    bluebird: {
        resolve: bluebirdMemoizedResolve,
        reject: bluebirdMemoizedReject,
        expiring: bluebirdMemoizedExpiring,
    },
    native: {
        resolve: nativeMemoizedResolve,
        reject: nativeMemoizedReject,
        expiring: nativeMemoizedExpiring,
    },
};
describe('moize.promise', () => {
    ['native', 'bluebird'].forEach((type) => {
        const Constructor = TYPES[type];
        ['resolve', 'reject', 'expiring'].forEach((test) => {
            const methodType = METHODS[type];
            const method = methodType[test];
            it(`should handle ${test}`, () => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    yield testItem([6, 9], method, Constructor);
                    if (test === 'reject') {
                        throw new Error(`${test} should have rejected`);
                    }
                }
                catch (error) {
                    if (test !== 'reject') {
                        throw error;
                    }
                }
                if (test === 'expiring') {
                    expect(method.options.onCacheHit).toHaveBeenCalledWith(method.cache, method.options, method);
                    yield new Promise((resolve) => setTimeout(resolve, method.options.maxAge * 2)).then(() => {
                        expect(method.options.onExpire).toHaveBeenCalledTimes(1);
                    });
                }
            }));
        });
    });
});

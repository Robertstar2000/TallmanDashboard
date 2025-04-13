import moize from '../src';
const method = jest.fn(function ({ one, two }) {
    return [one, two.deep];
});
const memoized = moize.shallow(method);
describe('moize.shallow', () => {
    it('should memoized based on the shallow values', () => {
        const two = { deep: 2 };
        const resultA = memoized({ one: 1, two });
        const resultB = memoized({ one: 1, two });
        expect(resultA).toEqual([1, 2]);
        expect(resultA).toBe(resultB);
        expect(method).toHaveBeenCalledTimes(1);
        const resultC = memoized({ one: 1, two: Object.assign({}, two) });
        expect(resultC).toEqual(resultA);
        expect(resultC).not.toBe(resultA);
        expect(method).toHaveBeenCalledTimes(2);
    });
});

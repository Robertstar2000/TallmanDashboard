import moize from '../src';
const method = jest.fn(function ({ one, two }) {
    return [one, two.deep];
});
const memoized = moize.deep(method);
describe('moize.deep', () => {
    it('should memoized based on the deep values', () => {
        const resultA = memoized({ one: 1, two: { deep: 2 } });
        const resultB = memoized({ one: 1, two: { deep: 2 } });
        expect(resultA).toEqual([1, 2]);
        expect(resultA).toBe(resultB);
        expect(method).toHaveBeenCalledTimes(1);
    });
});

import moize from '../src';
const method = jest.fn(function (one, two, three) {
    return { one, two, three };
});
function transformer(args) {
    const newKey = [];
    let index = args.length;
    while (--index) {
        newKey[index - 1] = args[index];
    }
    return newKey;
}
const memoized = moize.transformArgs(transformer)(method);
const foo = 'foo';
const bar = 'bar';
const baz = 'baz';
describe('moize.transformArgs', () => {
    it('limits the args memoized by', () => {
        const resultA = memoized(foo, bar, baz);
        const resultB = memoized(null, bar, baz);
        expect(resultA).toEqual({ one: foo, two: bar, three: baz });
        expect(resultB).toBe(resultA);
        expect(method).toHaveBeenCalledTimes(1);
    });
});

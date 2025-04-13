import { getCustomModifiers } from './getCustomModifiers';
describe('when some modifiers are not an array', () => {
    const date = new Date();
    const dayModifiers = {
        foo: date
    };
    const result = getCustomModifiers(dayModifiers);
    test('should return as array', () => {
        expect(result.foo).toEqual([date]);
    });
});

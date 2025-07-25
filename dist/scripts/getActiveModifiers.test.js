import { addMonths } from 'date-fns';
import { InternalModifier } from 'types/Modifiers';
import { getActiveModifiers } from './getActiveModifiers';
const day = new Date();
const internalModifiers = {
    [InternalModifier.Outside]: [],
    [InternalModifier.Disabled]: [],
    [InternalModifier.Selected]: [],
    [InternalModifier.Hidden]: [],
    [InternalModifier.Today]: [],
    [InternalModifier.RangeStart]: [],
    [InternalModifier.RangeEnd]: [],
    [InternalModifier.RangeMiddle]: []
};
describe('when the day matches a modifier', () => {
    const modifiers = Object.assign(Object.assign({}, internalModifiers), { foo: [day] });
    const result = getActiveModifiers(day, modifiers);
    test('should return the modifier as active', () => {
        expect(result.foo).toBe(true);
    });
});
describe('when the day does not match a modifier', () => {
    const modifiers = Object.assign(Object.assign({}, internalModifiers), { foo: [] });
    const result = getActiveModifiers(day, modifiers);
    test('should not return the modifier as active', () => {
        expect(result.foo).toBeUndefined();
    });
});
describe('when the day is not in the same display month', () => {
    const modifiers = Object.assign({}, internalModifiers);
    const displayMonth = addMonths(day, 1);
    const result = getActiveModifiers(day, modifiers, displayMonth);
    test('should not return the modifier as active', () => {
        expect(result.outside).toBe(true);
    });
});

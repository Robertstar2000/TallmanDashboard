import { addDays } from 'date-fns';
import { getDefaultContextValues } from 'contexts/DayPicker/defaultContextValues';
import { InternalModifier } from 'types/Modifiers';
import { getInternalModifiers } from './getInternalModifiers';
const defaultDayPickerContext = getDefaultContextValues();
const defaultSelectMultipleContext = {
    selected: undefined,
    modifiers: { disabled: [] }
};
const defaultSelectRangeContext = {
    selected: undefined,
    modifiers: {
        disabled: [],
        range_start: [],
        range_end: [],
        range_middle: []
    }
};
const { Selected, Disabled, Hidden, Today, RangeEnd, RangeMiddle, RangeStart } = InternalModifier;
const internalModifiers = [Selected, Disabled, Hidden, Today];
test.each(internalModifiers)('should transform to array the modifiers from the "%s" prop', (propName) => {
    const value = new Date();
    const modifiers = getInternalModifiers(Object.assign(Object.assign({}, defaultDayPickerContext), { [propName]: value }), defaultSelectMultipleContext, defaultSelectRangeContext);
    expect(modifiers[propName]).toStrictEqual([value]);
});
describe('when navigation is limited by "fromDate"', () => {
    const fromDate = new Date();
    const dayPickerContext = Object.assign(Object.assign({}, defaultDayPickerContext), { fromDate });
    test('should add a "before" matcher to the "disabled" modifiers', () => {
        const modifiers = getInternalModifiers(dayPickerContext, defaultSelectMultipleContext, defaultSelectRangeContext);
        expect(modifiers.disabled).toStrictEqual([{ before: fromDate }]);
    });
});
describe('when navigation is limited by "toDate"', () => {
    const toDate = new Date();
    const dayPickerContext = Object.assign(Object.assign({}, defaultDayPickerContext), { toDate });
    test('should add an "after" matcher to the "disabled" modifiers', () => {
        const modifiers = getInternalModifiers(dayPickerContext, defaultSelectMultipleContext, defaultSelectRangeContext);
        expect(modifiers.disabled).toStrictEqual([{ after: toDate }]);
    });
});
describe('when in multiple select mode', () => {
    const disabledDate = new Date();
    const dayPickerContext = Object.assign(Object.assign({}, defaultDayPickerContext), { mode: 'multiple' });
    const selectMultipleContext = Object.assign(Object.assign({}, defaultSelectMultipleContext), { modifiers: {
            [Disabled]: [disabledDate]
        } });
    test('should add the disabled modifier from the select multiple context', () => {
        const modifiers = getInternalModifiers(dayPickerContext, selectMultipleContext, defaultSelectRangeContext);
        expect(modifiers.disabled).toStrictEqual([disabledDate]);
    });
});
describe('when in range select mode', () => {
    const disabled = [new Date()];
    const rangeStart = new Date();
    const rangeMiddle = [addDays(rangeStart, 1), addDays(rangeStart, 2)];
    const rangeEnd = [addDays(rangeStart, 3)];
    const dayPickerContext = Object.assign(Object.assign({}, defaultDayPickerContext), { mode: 'range' });
    const selectRangeContext = Object.assign(Object.assign({}, defaultSelectRangeContext), { modifiers: {
            [Disabled]: [disabled],
            [RangeStart]: [rangeStart],
            [RangeEnd]: rangeEnd,
            [RangeMiddle]: rangeMiddle
        } });
    let internalModifiers;
    beforeEach(() => {
        internalModifiers = getInternalModifiers(dayPickerContext, defaultSelectMultipleContext, selectRangeContext);
    });
    test('should add the Disabled modifier from the SelectRange context', () => {
        expect(internalModifiers[Disabled]).toStrictEqual(selectRangeContext.modifiers[Disabled]);
    });
    test('should add the RangeStart modifier from the SelectRange context', () => {
        expect(internalModifiers[RangeStart]).toStrictEqual(selectRangeContext.modifiers[RangeStart]);
    });
    test('should add the RangeEnd modifier from the SelectRange context', () => {
        expect(internalModifiers[RangeEnd]).toStrictEqual(selectRangeContext.modifiers[RangeEnd]);
    });
    test('should add the RangeMiddle modifier from the SelectRange context', () => {
        expect(internalModifiers[RangeMiddle]).toStrictEqual(selectRangeContext.modifiers[RangeMiddle]);
    });
});

import { addDays, addMonths } from 'date-fns';
import { renderDayPickerHook } from 'test/render';
import { freezeBeforeAll } from 'test/utils';
import { isMatch } from 'contexts/Modifiers/utils/isMatch';
import { useSelectMultiple } from './SelectMultipleContext';
const today = new Date(2021, 11, 8);
freezeBeforeAll(today);
function renderHook(props) {
    return renderDayPickerHook(useSelectMultiple, props);
}
describe('when is not a multiple select DayPicker', () => {
    const result = renderHook();
    test('the selected day should be undefined', () => {
        expect(result.current.selected).toBeUndefined();
    });
    test('the disabled modifiers should be empty', () => {
        expect(result.current.selected).toBeUndefined();
    });
});
const initialProps = {
    mode: 'multiple',
    onDayClick: jest.fn(),
    onSelect: jest.fn()
};
const selectedDay1 = today;
const selectedDay2 = addDays(today, 1);
const selectedDay3 = addDays(today, 4);
describe('when days are selected', () => {
    const selected = [selectedDay1, selectedDay2, selectedDay3];
    const dayPickerProps = Object.assign(Object.assign({}, initialProps), { selected });
    test('it should return the days as selected', () => {
        const result = renderHook(dayPickerProps);
        expect(result.current.selected).toStrictEqual(selected);
    });
    describe('when `onDayClick` is called with a not selected day', () => {
        const clickedDay = addDays(selectedDay1, -1);
        const activeModifiers = {};
        const event = {};
        beforeAll(() => {
            var _a, _b;
            const result = renderHook(dayPickerProps);
            (_b = (_a = result.current).onDayClick) === null || _b === void 0 ? void 0 : _b.call(_a, clickedDay, activeModifiers, event);
        });
        afterAll(() => {
            jest.resetAllMocks();
        });
        test('should call the `onDayClick` from the DayPicker props', () => {
            expect(dayPickerProps.onDayClick).toHaveBeenCalledWith(clickedDay, activeModifiers, event);
        });
        test('should call `onSelect` with the clicked day selected', () => {
            expect(dayPickerProps.onSelect).toHaveBeenCalledWith([...selected, clickedDay], clickedDay, activeModifiers, event);
        });
    });
    describe('when `onDayClick` is called with a selected day', () => {
        const clickedDay = selectedDay1;
        const activeModifiers = { selected: true };
        beforeAll(() => {
            var _a, _b;
            const result = renderHook(dayPickerProps);
            (_b = (_a = result.current).onDayClick) === null || _b === void 0 ? void 0 : _b.call(_a, clickedDay, activeModifiers, event);
        });
        afterAll(() => {
            jest.resetAllMocks();
        });
        const event = {};
        test('should call the `onDayClick` from the DayPicker props', () => {
            expect(dayPickerProps.onDayClick).toHaveBeenCalledWith(clickedDay, activeModifiers, event);
        });
        test('should call `onSelect` without the clicked day selected', () => {
            const expectedSelected = selected.filter((day) => day !== clickedDay);
            expect(dayPickerProps.onSelect).toHaveBeenCalledWith(expectedSelected, clickedDay, activeModifiers, event);
        });
    });
});
describe('when the maximum number of days are selected', () => {
    const selected = [selectedDay1, selectedDay2, selectedDay3];
    const dayPickerProps = Object.assign(Object.assign({}, initialProps), { selected, max: selected.length });
    test('the selected days should not be disabled', () => {
        const result = renderHook(dayPickerProps);
        const { disabled } = result.current.modifiers;
        expect(isMatch(selectedDay1, disabled)).toBe(false);
        expect(isMatch(selectedDay2, disabled)).toBe(false);
        expect(isMatch(selectedDay3, disabled)).toBe(false);
    });
    test('the other days should be disabled', () => {
        const result = renderHook(dayPickerProps);
        const { disabled } = result.current.modifiers;
        expect(isMatch(addMonths(selectedDay1, 1), disabled)).toBe(true);
        expect(isMatch(addMonths(selectedDay2, 1), disabled)).toBe(true);
    });
    describe('when `onDayClick` is called', () => {
        const clickedDay = addMonths(selectedDay1, 1);
        const activeModifiers = {};
        beforeAll(() => {
            var _a, _b;
            const result = renderHook(dayPickerProps);
            (_b = (_a = result.current).onDayClick) === null || _b === void 0 ? void 0 : _b.call(_a, clickedDay, activeModifiers, event);
        });
        afterAll(() => {
            jest.resetAllMocks();
        });
        const event = {};
        test('should call the `onDayClick` from the DayPicker props', () => {
            expect(dayPickerProps.onDayClick).toHaveBeenCalledWith(clickedDay, activeModifiers, event);
        });
        test('should not call `onSelect`', () => {
            expect(dayPickerProps.onSelect).not.toHaveBeenCalled();
        });
    });
});
describe('when the minimum number of days are selected', () => {
    const selected = [selectedDay1, selectedDay2, selectedDay3];
    const dayPickerProps = Object.assign(Object.assign({}, initialProps), { selected, min: selected.length });
    describe('when `onDayClick` is called with one of the selected days', () => {
        const clickedDay = selected[0];
        const activeModifiers = { selected: true };
        beforeAll(() => {
            var _a, _b;
            const result = renderHook(dayPickerProps);
            (_b = (_a = result.current).onDayClick) === null || _b === void 0 ? void 0 : _b.call(_a, clickedDay, activeModifiers, event);
        });
        afterAll(() => {
            jest.resetAllMocks();
        });
        const event = {};
        test('should call the `onDayClick` from the DayPicker props', () => {
            expect(dayPickerProps.onDayClick).toHaveBeenCalledWith(clickedDay, activeModifiers, event);
        });
        test('should not call `onSelect`', () => {
            expect(dayPickerProps.onSelect).not.toHaveBeenCalled();
        });
    });
});

import { renderDayPickerHook } from 'test/render';
import { freezeBeforeAll } from 'test/utils';
import { useSelectSingle } from './SelectSingleContext';
const today = new Date(2021, 11, 8);
freezeBeforeAll(today);
function renderHook(props) {
    return renderDayPickerHook(useSelectSingle, props);
}
describe('when is not a single select DayPicker', () => {
    test('the selected day should be undefined', () => {
        const result = renderHook();
        expect(result.current.selected).toBeUndefined();
    });
});
describe('when a day is selected from DayPicker props', () => {
    test('the selected day should be today', () => {
        const dayPickerProps = {
            mode: 'single',
            selected: today
        };
        const result = renderHook(dayPickerProps);
        expect(result.current.selected).toBe(today);
    });
});
describe('when onDayClick is called', () => {
    const dayPickerProps = {
        mode: 'single',
        onSelect: jest.fn(),
        onDayClick: jest.fn()
    };
    const result = renderHook(dayPickerProps);
    const activeModifiers = {};
    const event = {};
    test('should call the `onSelect` event handler', () => {
        var _a, _b;
        (_b = (_a = result.current).onDayClick) === null || _b === void 0 ? void 0 : _b.call(_a, today, activeModifiers, event);
        expect(dayPickerProps.onSelect).toHaveBeenCalledWith(today, today, activeModifiers, event);
    });
    test('should call the `onDayClick` event handler', () => {
        var _a, _b;
        (_b = (_a = result.current).onDayClick) === null || _b === void 0 ? void 0 : _b.call(_a, today, activeModifiers, event);
        expect(dayPickerProps.onDayClick).toHaveBeenCalledWith(today, activeModifiers, event);
    });
});
describe('if a selected day is not required', () => {
    const dayPickerProps = {
        mode: 'single',
        onSelect: jest.fn(),
        required: false
    };
    test('should call the `onSelect` event handler with an undefined day', () => {
        var _a, _b;
        const result = renderHook(dayPickerProps);
        const activeModifiers = { selected: true };
        const event = {};
        (_b = (_a = result.current).onDayClick) === null || _b === void 0 ? void 0 : _b.call(_a, today, activeModifiers, event);
        expect(dayPickerProps.onSelect).toHaveBeenCalledWith(undefined, today, activeModifiers, event);
    });
});

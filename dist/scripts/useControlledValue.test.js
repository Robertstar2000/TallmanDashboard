var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { act } from 'react-dom/test-utils';
import { renderDayPickerHook } from 'test/render';
import { useControlledValue } from './useControlledValue';
function renderHook(defaultValue, controlledValue) {
    return renderDayPickerHook(() => useControlledValue(defaultValue, controlledValue));
}
describe('when the value is controlled', () => {
    const defaultValue = 'foo'; // not controlled
    const controlledValue = 'bar'; // now controlled
    test('should return the controlled value', () => {
        const result = renderHook(defaultValue, controlledValue);
        expect(result.current[0]).toBe(controlledValue);
    });
    describe('when setting a new value', () => {
        const newValue = 'taz';
        test('should return the controlled value instead', () => {
            const result = renderHook(defaultValue, controlledValue);
            act(() => result.current[1](newValue));
            expect(result.current[0]).toBe(controlledValue);
        });
    });
});
describe('when the value is not controlled', () => {
    const defaultValue = 'foo';
    const controlledValue = undefined;
    test('should return the value', () => {
        const result = renderHook(defaultValue, controlledValue);
        expect(result.current[0]).toBe(defaultValue);
    });
    describe('when setting a new value', () => {
        const newValue = 'bar';
        test('should return the new value', () => __awaiter(void 0, void 0, void 0, function* () {
            const result = renderHook(defaultValue, controlledValue);
            yield act(() => result.current[1](newValue));
            expect(result.current[0]).toBe(newValue);
        }));
    });
});

/* eslint-disable testing-library/render-result-naming-convention */
import { es } from 'date-fns/locale';
import { renderDayPickerHook } from 'test/render';
import { freezeBeforeAll } from 'test/utils';
import { useDayPicker } from 'contexts/DayPicker';
import { getDefaultContextValues } from 'contexts/DayPicker/defaultContextValues';
const today = new Date(2022, 5, 13);
const defaults = getDefaultContextValues();
freezeBeforeAll(today);
function renderHook(props) {
    return renderDayPickerHook(useDayPicker, props);
}
describe('when rendered without props', () => {
    const testPropNames = Object.keys(defaults).filter((key) => key !== 'today');
    test.each(testPropNames)('should use the %s default value', (propName) => {
        const result = renderHook();
        expect(result.current[propName]).toEqual(defaults[propName]);
    });
});
describe('when passing "locale" from props', () => {
    const locale = es;
    test('should return the custom locale', () => {
        const result = renderHook({ locale });
        expect(result.current.locale).toBe(locale);
    });
});
describe('when passing "numberOfMonths" from props', () => {
    const numberOfMonths = 4;
    test('should return the custom numberOfMonths', () => {
        const result = renderHook({ numberOfMonths });
        expect(result.current.numberOfMonths).toBe(4);
    });
});
describe('when passing "today" from props', () => {
    const today = new Date(2010, 9, 11);
    test('should return the custom "today"', () => {
        const result = renderHook({ today });
        expect(result.current.today).toBe(today);
    });
});
describe('when passing "captionLayout" from props', () => {
    const captionLayout = 'dropdown';
    const fromYear = 2000;
    const toYear = 2010;
    const dayPickerProps = { captionLayout, fromYear, toYear };
    test('should return the custom "captionLayout"', () => {
        const result = renderHook(dayPickerProps);
        expect(result.current.captionLayout).toBe(captionLayout);
    });
});
describe('when "fromDate" and "toDate" are undefined', () => {
    const fromDate = undefined;
    const toDate = undefined;
    describe('when using "dropdown" as "captionLayout"', () => {
        const captionLayout = 'dropdown';
        test('should return "buttons" as "captionLayout"', () => {
            const result = renderHook({
                fromDate,
                toDate,
                captionLayout
            });
            expect(result.current.captionLayout).toBe('buttons');
        });
    });
});
describe('when "fromDate" is undefined, but not "toDate"', () => {
    const fromDate = undefined;
    const toDate = new Date();
    describe('when using "dropdown" as "captionLayout"', () => {
        const captionLayout = 'dropdown';
        test('should return "buttons" as "captionLayout"', () => {
            const result = renderHook({
                fromDate,
                toDate,
                captionLayout
            });
            expect(result.current.captionLayout).toBe('buttons');
        });
    });
});
describe('when "toDate" is undefined, but not "fromDate"', () => {
    const fromDate = new Date();
    const toDate = undefined;
    describe('when using "dropdown" as "captionLayout"', () => {
        const captionLayout = 'dropdown';
        test('should return "buttons" as "captionLayout"', () => {
            const result = renderHook({
                fromDate,
                toDate,
                captionLayout
            });
            expect(result.current.captionLayout).toBe('buttons');
        });
    });
});
describe('when using "dropdown" as "captionLayout"', () => {
    const captionLayout = 'dropdown';
    const fromYear = 2000;
    const toYear = 2010;
    test('should return the custom "captionLayout"', () => {
        const result = renderHook({ captionLayout, fromYear, toYear });
        expect(result.current.captionLayout).toBe(captionLayout);
    });
});
describe('when passing "modifiers" from props', () => {
    const modifiers = { foo: new Date() };
    test('should return the custom "modifiers"', () => {
        const result = renderHook({ modifiers });
        expect(result.current.modifiers).toStrictEqual(modifiers);
    });
});
describe('when passing "modifiersClassNames" from props', () => {
    const modifiersClassNames = { foo: 'bar' };
    test('should return the custom "modifiersClassNames"', () => {
        const result = renderHook({ modifiersClassNames });
        expect(result.current.modifiersClassNames).toStrictEqual(modifiersClassNames);
    });
});
describe('when passing "styles" from props', () => {
    const styles = { caption: { color: 'red ' } };
    test('should include the custom "styles"', () => {
        const result = renderHook({ styles });
        expect(result.current.styles).toStrictEqual(Object.assign(Object.assign({}, defaults.styles), styles));
    });
});
describe('when passing "classNames" from props', () => {
    const classNames = { caption: 'foo' };
    test('should include the custom "classNames"', () => {
        const result = renderHook({ classNames });
        expect(result.current.classNames).toStrictEqual(Object.assign(Object.assign({}, defaults.classNames), classNames));
    });
});
describe('when passing "formatters" from props', () => {
    const formatters = { formatCaption: jest.fn() };
    test('should include the custom "formatters"', () => {
        const result = renderHook({ formatters });
        expect(result.current.formatters).toStrictEqual(Object.assign(Object.assign({}, defaults.formatters), formatters));
    });
});
describe('when passing "labels" from props', () => {
    const labels = { labelDay: jest.fn() };
    test('should include the custom "labels"', () => {
        const result = renderHook({ labels });
        expect(result.current.labels).toStrictEqual(Object.assign(Object.assign({}, defaults.labels), labels));
    });
});
describe('when passing an "id" from props', () => {
    test('should return the id', () => {
        const result = renderHook({ id: 'foo' });
        expect(result.current.id).toBe('foo');
    });
});
describe('when in selection mode', () => {
    const mode = 'multiple';
    const onSelect = jest.fn();
    test('should return the "onSelect" event handler', () => {
        const result = renderHook({ mode, onSelect });
        expect(result.current.onSelect).toBe(onSelect);
    });
});

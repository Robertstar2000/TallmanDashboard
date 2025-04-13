import { defaultClassNames } from 'contexts/DayPicker/defaultClassNames';
import { InternalModifier } from 'types/Modifiers';
import { getDayClassNames } from './getDayClassNames';
const internalModifiers = Object.values(InternalModifier);
test('should include the day class name', () => {
    const dayPicker = {
        modifiersClassNames: {},
        classNames: defaultClassNames
    };
    const activeModifiers = {};
    expect(getDayClassNames(dayPicker, activeModifiers)).toContain(defaultClassNames.day);
});
describe('when using "modifiersClassNames" for a custom modifier', () => {
    const modifierClassName = `foo-class`;
    const dayPicker = {
        modifiersClassNames: {
            foo: modifierClassName
        },
        classNames: defaultClassNames
    };
    const activeModifiers = { foo: true };
    test('should return the custom class name for the modifier', () => {
        expect(getDayClassNames(dayPicker, activeModifiers)).toContain(modifierClassName);
    });
});
describe.each(internalModifiers)('when using "modifiersClassNames" for the %s (internal) modifier', (internalModifier) => {
    const modifierClassName = `foo-${internalModifier}`;
    const dayPicker = {
        modifiersClassNames: {
            [internalModifier]: modifierClassName
        },
        classNames: defaultClassNames
    };
    const activeModifiers = { [internalModifier]: true };
    test('should return the custom class name for the modifier', () => {
        expect(getDayClassNames(dayPicker, activeModifiers)).toContain(modifierClassName);
    });
    test('should not include the default class name for the modifier', () => {
        expect(getDayClassNames(dayPicker, activeModifiers)).not.toContain(defaultClassNames.day_selected);
    });
});

/** Return the style for the Day element, according to the given active modifiers. */
export function getDayStyle(dayPicker, activeModifiers) {
    let style = Object.assign({}, dayPicker.styles.day);
    Object.keys(activeModifiers).forEach((modifier) => {
        var _a;
        style = Object.assign(Object.assign({}, style), (_a = dayPicker.modifiersStyles) === null || _a === void 0 ? void 0 : _a[modifier]);
    });
    return style;
}

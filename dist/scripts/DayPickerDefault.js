/** Returns true when the props are of type {@link DayPickerDefaultProps}. */
export function isDayPickerDefault(props) {
    return props.mode === undefined || props.mode === 'default';
}

/** The name of the modifiers that are used internally by DayPicker. */
export var InternalModifier;
(function (InternalModifier) {
    InternalModifier["Outside"] = "outside";
    /** Name of the modifier applied to the disabled days, using the `disabled` prop. */
    InternalModifier["Disabled"] = "disabled";
    /** Name of the modifier applied to the selected days using the `selected` prop). */
    InternalModifier["Selected"] = "selected";
    /** Name of the modifier applied to the hidden days using the `hidden` prop). */
    InternalModifier["Hidden"] = "hidden";
    /** Name of the modifier applied to the day specified using the `today` prop). */
    InternalModifier["Today"] = "today";
    /** The modifier applied to the day starting a selected range, when in range selection mode.  */
    InternalModifier["RangeStart"] = "range_start";
    /** The modifier applied to the day ending a selected range, when in range selection mode.  */
    InternalModifier["RangeEnd"] = "range_end";
    /** The modifier applied to the days between the start and the end of a selected range, when in range selection mode.  */
    InternalModifier["RangeMiddle"] = "range_middle";
})(InternalModifier || (InternalModifier = {}));

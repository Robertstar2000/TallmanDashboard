import { useState } from 'react';
import { differenceInCalendarDays, format as _format, parse } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { parseFromToProps } from 'contexts/DayPicker/utils';
import { isValidDate } from './utils/isValidDate';
/** Return props and setters for binding an input field to DayPicker. */
export function useInput(options = {}) {
    const { locale = enUS, required, format = 'PP', defaultSelected, today = new Date() } = options;
    const { fromDate, toDate } = parseFromToProps(options);
    // Shortcut to the DateFns functions
    const parseValue = (value) => parse(value, format, today, { locale });
    // Initialize states
    const [month, setMonth] = useState(defaultSelected !== null && defaultSelected !== void 0 ? defaultSelected : today);
    const [selectedDay, setSelectedDay] = useState(defaultSelected);
    const defaultInputValue = defaultSelected
        ? _format(defaultSelected, format, { locale })
        : '';
    const [inputValue, setInputValue] = useState(defaultInputValue);
    const reset = () => {
        setSelectedDay(defaultSelected);
        setMonth(defaultSelected !== null && defaultSelected !== void 0 ? defaultSelected : today);
        setInputValue(defaultInputValue !== null && defaultInputValue !== void 0 ? defaultInputValue : '');
    };
    const setSelected = (date) => {
        setSelectedDay(date);
        setMonth(date !== null && date !== void 0 ? date : today);
        setInputValue(date ? _format(date, format, { locale }) : '');
    };
    const handleDayClick = (day, { selected }) => {
        if (!required && selected) {
            setSelectedDay(undefined);
            setInputValue('');
            return;
        }
        setSelectedDay(day);
        setInputValue(day ? _format(day, format, { locale }) : '');
    };
    const handleMonthChange = (month) => {
        setMonth(month);
    };
    // When changing the input field, save its value in state and check if the
    // string is a valid date. If it is a valid day, set it as selected and update
    // the calendar’s month.
    const handleChange = (e) => {
        setInputValue(e.target.value);
        const day = parseValue(e.target.value);
        const isBefore = fromDate && differenceInCalendarDays(fromDate, day) > 0;
        const isAfter = toDate && differenceInCalendarDays(day, toDate) > 0;
        if (!isValidDate(day) || isBefore || isAfter) {
            setSelectedDay(undefined);
            return;
        }
        setSelectedDay(day);
        setMonth(day);
    };
    // Special case for _required_ fields: on blur, if the value of the input is not
    // a valid date, reset the calendar and the input value.
    const handleBlur = (e) => {
        const day = parseValue(e.target.value);
        if (!isValidDate(day)) {
            reset();
        }
    };
    // When focusing, make sure DayPicker visualizes the month of the date in the
    // input field.
    const handleFocus = (e) => {
        if (!e.target.value) {
            reset();
            return;
        }
        const day = parseValue(e.target.value);
        if (isValidDate(day)) {
            setMonth(day);
        }
    };
    const dayPickerProps = {
        month: month,
        onDayClick: handleDayClick,
        onMonthChange: handleMonthChange,
        selected: selectedDay,
        locale,
        fromDate,
        toDate,
        today
    };
    const inputProps = {
        onBlur: handleBlur,
        onChange: handleChange,
        onFocus: handleFocus,
        value: inputValue,
        placeholder: _format(new Date(), format, { locale })
    };
    return { dayPickerProps, inputProps, reset, setSelected };
}

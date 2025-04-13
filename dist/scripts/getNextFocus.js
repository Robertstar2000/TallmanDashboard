import { addDays, addMonths, addWeeks, addYears, endOfISOWeek, endOfWeek, max, min, startOfISOWeek, startOfWeek } from 'date-fns';
import { getActiveModifiers } from 'contexts/Modifiers';
const MAX_RETRY = 365;
/** Return the next date to be focused. */
export function getNextFocus(focusedDay, options) {
    const { moveBy, direction, context, modifiers, retry = { count: 0, lastFocused: focusedDay } } = options;
    const { weekStartsOn, fromDate, toDate, locale } = context;
    const moveFns = {
        day: addDays,
        week: addWeeks,
        month: addMonths,
        year: addYears,
        startOfWeek: (date) => context.ISOWeek
            ? startOfISOWeek(date)
            : startOfWeek(date, { locale, weekStartsOn }),
        endOfWeek: (date) => context.ISOWeek
            ? endOfISOWeek(date)
            : endOfWeek(date, { locale, weekStartsOn })
    };
    let newFocusedDay = moveFns[moveBy](focusedDay, direction === 'after' ? 1 : -1);
    if (direction === 'before' && fromDate) {
        newFocusedDay = max([fromDate, newFocusedDay]);
    }
    else if (direction === 'after' && toDate) {
        newFocusedDay = min([toDate, newFocusedDay]);
    }
    let isFocusable = true;
    if (modifiers) {
        const activeModifiers = getActiveModifiers(newFocusedDay, modifiers);
        isFocusable = !activeModifiers.disabled && !activeModifiers.hidden;
    }
    if (isFocusable) {
        return newFocusedDay;
    }
    else {
        if (retry.count > MAX_RETRY) {
            return retry.lastFocused;
        }
        return getNextFocus(newFocusedDay, {
            moveBy,
            direction,
            context,
            modifiers,
            retry: Object.assign(Object.assign({}, retry), { count: retry.count + 1 })
        });
    }
}

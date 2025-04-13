import { addDays, startOfISOWeek, startOfWeek } from 'date-fns';
/**
 * Generate a series of 7 days, starting from the week, to use for formatting
 * the weekday names (Monday, Tuesday, etc.).
 */
export function getWeekdays(locale, 
/** The index of the first day of the week (0 - Sunday). */
weekStartsOn, 
/** Use ISOWeek instead of locale/ */
ISOWeek) {
    const start = ISOWeek
        ? startOfISOWeek(new Date())
        : startOfWeek(new Date(), { locale, weekStartsOn });
    const days = [];
    for (let i = 0; i < 7; i++) {
        const day = addDays(start, i);
        days.push(day);
    }
    return days;
}

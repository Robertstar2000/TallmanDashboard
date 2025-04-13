import { addDays, differenceInCalendarDays, endOfISOWeek, endOfWeek, getISOWeek, getWeek, startOfISOWeek, startOfWeek } from 'date-fns';
/** Return the weeks between two dates.  */
export function daysToMonthWeeks(fromDate, toDate, options) {
    const toWeek = (options === null || options === void 0 ? void 0 : options.ISOWeek)
        ? endOfISOWeek(toDate)
        : endOfWeek(toDate, options);
    const fromWeek = (options === null || options === void 0 ? void 0 : options.ISOWeek)
        ? startOfISOWeek(fromDate)
        : startOfWeek(fromDate, options);
    const nOfDays = differenceInCalendarDays(toWeek, fromWeek);
    const days = [];
    for (let i = 0; i <= nOfDays; i++) {
        days.push(addDays(fromWeek, i));
    }
    const weeksInMonth = days.reduce((result, date) => {
        const weekNumber = (options === null || options === void 0 ? void 0 : options.ISOWeek)
            ? getISOWeek(date)
            : getWeek(date, options);
        const existingWeek = result.find((value) => value.weekNumber === weekNumber);
        if (existingWeek) {
            existingWeek.dates.push(date);
            return result;
        }
        result.push({
            weekNumber,
            dates: [date]
        });
        return result;
    }, []);
    return weeksInMonth;
}

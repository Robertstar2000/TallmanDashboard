import { addWeeks, endOfMonth, getWeeksInMonth, startOfMonth } from 'date-fns';
import { daysToMonthWeeks } from './daysToMonthWeeks';
/**
 * Return the weeks belonging to the given month, adding the "outside days" to
 * the first and last week.
 */
export function getMonthWeeks(month, options) {
    const weeksInMonth = daysToMonthWeeks(startOfMonth(month), endOfMonth(month), options);
    if (options === null || options === void 0 ? void 0 : options.useFixedWeeks) {
        // Add extra weeks to the month, up to 6 weeks
        const nrOfMonthWeeks = getWeeksInMonth(month, options);
        if (nrOfMonthWeeks < 6) {
            const lastWeek = weeksInMonth[weeksInMonth.length - 1];
            const lastDate = lastWeek.dates[lastWeek.dates.length - 1];
            const toDate = addWeeks(lastDate, 6 - nrOfMonthWeeks);
            const extraWeeks = daysToMonthWeeks(addWeeks(lastDate, 1), toDate, options);
            weeksInMonth.push(...extraWeeks);
        }
    }
    return weeksInMonth;
}

import { format } from 'date-fns';
/**
 * The default formatter for the name of the weekday.
 */
export function formatWeekdayName(weekday, options) {
    return format(weekday, 'cccccc', options);
}

import { format } from 'date-fns';
/**
 * The default formatter for the Day button.
 */
export function formatDay(day, options) {
    return format(day, 'd', options);
}

import { format } from 'date-fns';
/**
 * The default formatter for the Year caption.
 */
export function formatYearCaption(year, options) {
    return format(year, 'yyyy', options);
}

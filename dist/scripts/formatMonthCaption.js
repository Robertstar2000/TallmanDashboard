import { format } from 'date-fns';
/**
 * The default formatter for the Month caption.
 */
export function formatMonthCaption(month, options) {
    return format(month, 'LLLL', options);
}

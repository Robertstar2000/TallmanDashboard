import { format } from 'date-fns';
/**
 * The default formatter for the caption.
 */
export function formatCaption(month, options) {
    return format(month, 'LLLL y', options);
}

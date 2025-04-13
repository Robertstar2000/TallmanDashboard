import { format } from 'date-fns';
/**
 * The default ARIA label for the Weekday element.
 */
export const labelWeekday = (day, options) => {
    return format(day, 'cccc', options);
};

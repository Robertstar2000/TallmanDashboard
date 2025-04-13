import { format } from 'date-fns';
/**
 * The default ARIA label for the day button.
 */
export const labelDay = (day, activeModifiers, options) => {
    return format(day, 'do MMMM (EEEE)', options);
};

import { startOfMonth } from 'date-fns';
import { useDayPicker } from 'contexts/DayPicker';
import { useControlledValue } from 'hooks/useControlledValue';
import { getInitialMonth } from './utils/getInitialMonth';
/** Controls the navigation state. */
export function useNavigationState() {
    const context = useDayPicker();
    const initialMonth = getInitialMonth(context);
    const [month, setMonth] = useControlledValue(initialMonth, context.month);
    const goToMonth = (date) => {
        var _a;
        if (context.disableNavigation)
            return;
        const month = startOfMonth(date);
        setMonth(month);
        (_a = context.onMonthChange) === null || _a === void 0 ? void 0 : _a.call(context, month);
    };
    return [month, goToMonth];
}

'use client';
import { formatTitle } from '@/lib/utils/format';
export function MetricTitle({ name }) {
    return (<span className="text-sm font-medium">
      {formatTitle(name)}
    </span>);
}

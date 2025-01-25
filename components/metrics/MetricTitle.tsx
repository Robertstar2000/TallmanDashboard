'use client';

import { formatTitle } from '@/lib/utils/format';

interface MetricTitleProps {
  name: string;
}

export function MetricTitle({ name }: MetricTitleProps) {
  return (
    <span className="text-sm font-medium">
      {formatTitle(name)}
    </span>
  );
}
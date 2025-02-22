'use client';

import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { AdminVariable } from '@/lib/types';
import { formatCurrency, formatNumber, isCurrencyMetric } from '@/lib/utils/format';

interface MetricsCardProps {
  variable: AdminVariable;
}

export function MetricsCard({ variable }: MetricsCardProps) {
  const formattedValue = isCurrencyMetric(variable.name)
    ? formatCurrency(variable.value)
    : formatNumber(variable.value);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardContent className="p-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">{variable.name}</p>
            <h3 className="text-2xl font-bold">{formattedValue}</h3>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

'use client';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { formatCurrency, formatNumber } from '@/lib/utils/format';
export function MetricCard({ icon, title, value, gradient, onClick }) {
    const formattedValue = typeof value === 'number'
        ? (title.toLowerCase().includes('revenue') ||
            title.toLowerCase().includes('invoice') ||
            title.toLowerCase().includes('sales'))
            ? formatCurrency(value)
            : formatNumber(value)
        : value;
    return (<motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
      <Card className={`${gradient} cursor-pointer hover:shadow-lg transition-shadow duration-200 bg-opacity-15`} onClick={onClick}>
        <CardContent className="p-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-black">
              <span className="text-black">{icon}</span>
              <p className="text-sm font-medium">{title}</p>
            </div>
            <h3 className="text-2xl font-bold text-black">{formattedValue}</h3>
          </div>
        </CardContent>
      </Card>
    </motion.div>);
}

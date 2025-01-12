'use client';

import * as React from 'react';
import { ComponentType } from 'react';
import * as RechartsPrimitive from 'recharts';
import type { TooltipProps } from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { cn } from '@/lib/utils';

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: '', dark: '.dark' } as const;

interface ChartPayload {
  dataKey: string;
  name: string;
  value: number | string;
  [key: string]: any;
}

interface ChartConfig {
  icon?: ComponentType;
  color?: string;
  theme?: keyof typeof THEMES;
  label?: string;
}

interface ChartContextValue {
  config: Record<string, ChartConfig>;
}

const ChartContext = React.createContext<ChartContextValue | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />');
  }

  return context;
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    config: Record<string, ChartConfig>;
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >['children'];
  }
>(({ className, children, config, ...props }, ref) => {
  const id = React.useId();

  return (
    <ChartContext.Provider value={{ config }}>
      <div ref={ref} className={cn('w-full', className)} {...props}>
        <ChartStyle id={id} config={config} />
        <div className="h-[400px] w-full">
          <RechartsPrimitive.ResponsiveContainer>
            {children}
          </RechartsPrimitive.ResponsiveContainer>
        </div>
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = 'Chart';

const ChartStyle = ({ id, config }: { id: string; config: Record<string, ChartConfig> }) => {
  const colorConfig = Object.entries(config).filter(
    ([_, config]) => config.theme || config.color
  );

  if (!colorConfig.length) {
    return null;
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color;
    return color ? `  --color-${key}: ${color};` : null;
  })
  .join('\n')}
}
`
          )
          .join('\n'),
      }}
    />
  );
};

interface ChartTooltipContentProps
  extends React.ComponentProps<'div'>,
    Pick<TooltipProps<ValueType, NameType>, 'active' | 'payload'> {
  config?: Record<string, ChartConfig>;
  formatter?: (
    value: number,
    name: string,
    item: any,
    index: number,
    payload: any[]
  ) => React.ReactNode;
  label?: string;
  labelFormatter?: (label: string) => string;
  labelClassName?: string;
}

const ChartTooltip = RechartsPrimitive.Tooltip;

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  ChartTooltipContentProps & {
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: 'line' | 'dot' | 'dashed';
    nameKey?: string;
    labelKey?: string;
  }
>(
  (
    {
      active,
      payload,
      config,
      className,
      formatter,
      label,
      labelFormatter,
      labelClassName,
      hideLabel,
      hideIndicator,
      indicator = 'dot',
      nameKey,
      labelKey,
      ...props
    },
    ref
  ) => {
    if (!active || !payload) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg border bg-background px-3 py-2 text-sm shadow-md',
          className
        )}
        {...props}
      >
        {!hideLabel && label && (
          <div className={cn('mb-2 text-muted-foreground', labelClassName)}>
            {labelFormatter ? labelFormatter(label) : label}
          </div>
        )}
        <div className="grid gap-2">
          {payload.map((item: any, index: number) => {
            const key = `${nameKey || item.dataKey || item.name || 'value'}`;
            const itemConfig = getPayloadConfigFromPayload(config, item, key);
            const value = typeof item.value === 'string' ? parseFloat(item.value) : item.value;

            return (
              <div
                key={item.dataKey || index}
                className="flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-1">
                  {!hideIndicator && itemConfig?.icon && (
                    <div className={cn('h-3 w-3', itemConfig.color)}>
                      {React.createElement(itemConfig.icon)}
                    </div>
                  )}
                  <span className="text-muted-foreground">
                    {item[nameKey || 'name'] || key}:
                  </span>
                </div>
                <span className="font-medium">
                  {formatter
                    ? formatter(value, item[nameKey || 'name'] || key, item, index, payload)
                    : value.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

ChartTooltipContent.displayName = 'ChartTooltipContent';

const ChartLegend = RechartsPrimitive.Legend;

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    payload?: ChartPayload[];
    config?: Record<string, ChartConfig>;
  }
>(({ className, payload, config, ...props }, ref) => {
  if (!payload) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn('flex flex-wrap items-center gap-4', className)}
      {...props}
    >
      {payload.map((item, index) => {
        const itemConfig = getPayloadConfigFromPayload(config, item, item.dataKey);
        return (
          <div
            key={`item-${index}`}
            className="flex items-center gap-1.5"
          >
            {itemConfig.icon && (
              <div className={cn('h-3 w-3', itemConfig.color)}>
                {React.createElement(itemConfig.icon)}
              </div>
            )}
            <span className="text-sm text-muted-foreground">
              {itemConfig.label || item.name}
            </span>
          </div>
        );
      })}
    </div>
  );
});

ChartLegendContent.displayName = 'ChartLegendContent';

function getPayloadConfigFromPayload(
  config: Record<string, ChartConfig> | undefined,
  payload: ChartPayload,
  key: string
): ChartConfig {
  if (!config || typeof payload !== 'object' || payload === null) {
    return {
      icon: undefined,
      color: undefined,
      label: undefined
    };
  }

  const dataKey = payload.dataKey || key;
  return config[dataKey] || {};
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
};

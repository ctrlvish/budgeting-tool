import {
    Bar,
    BarChart,
    CartesianGrid,
    ReferenceLine,
    XAxis,
    YAxis
} from "recharts"
import type { YearlyMonthBreakdown } from "@/lib/yearly-breakdown"
import PeriodNavigation from "@/components/period-navigation"
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig
} from "@/components/ui/chart"

const chartConfig = {
    needs: {
        label: 'Needs',
        color: 'var(--bucket-needs)'
    },
    wants: {
        label: 'Wants',
        color: 'var(--bucket-wants)'
    },
    savings: {
        label: 'Savings',
        color: 'var(--bucket-savings)'
    }
} satisfies ChartConfig

const currencyFormatter = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD'
})

interface YearlyBreakdownProps {
    data : YearlyMonthBreakdown[]
    disableNext : boolean
    year : number
    onNext : () => void
    onPrevious : () => void
    onReset : () => void
}

function formatChartPercentage(value : unknown) {
    if (typeof value !== 'number') return '—'
    if (value > 0 && value < 1) return '<1%'

    return `${Math.round(value)}%`
}

function formatMoney(amountCents : number) {
    return currencyFormatter.format(amountCents / 100)
}

export default function YearlyBreakdown({
    data,
    disableNext,
    year,
    onNext,
    onPrevious,
    onReset
} : YearlyBreakdownProps) {
    const hasIncome = data.some(month => month.hasIncome)
    const hasActivity = data.some(month => month.hasActivity)

    return (
        <Card>
            <CardHeader>
                <CardTitle>Yearly overview</CardTitle>
                <CardDescription>{year}</CardDescription>
                <CardAction>
                    <PeriodNavigation
                        disableNext={disableNext}
                        nextLabel="Next year"
                        previousLabel="Previous year"
                        onNext={onNext}
                        onPrevious={onPrevious}
                        onReset={onReset}
                        resetLabel="Reset to current year"
                        showReset={!disableNext}
                    />
                </CardAction>
            </CardHeader>
            <CardContent>
                {!hasIncome ? (
                    <div className="flex h-64 items-center justify-center text-center">
                        <p className="text-xs text-muted-foreground">
                            {hasActivity
                                ? 'Add income to view this year'
                                : 'No activity this year'}
                        </p>
                    </div>
                ) : (
                    <ChartContainer
                        config={chartConfig}
                        className="h-64 w-full aspect-auto"
                    >
                        <BarChart
                            accessibilityLayer
                            data={data}
                            margin={{top: 8, right: 4, bottom: 0, left: 4}}
                        >
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="month"
                                tickLine={false}
                                tickMargin={8}
                                axisLine={false}
                            />
                            <YAxis hide domain={['auto', 'auto']} />
                            <ReferenceLine y={0} />
                            <ChartTooltip
                                cursor={false}
                                content={
                                    <ChartTooltipContent
                                        formatter={(value, name, item, index) => (
                                            <>
                                                {index === 0 && (
                                                    <div className="mb-1 flex w-full basis-full justify-between border-b border-border/50 pb-1.5">
                                                        <span className="text-muted-foreground">
                                                            Income
                                                        </span>
                                                        <span className="font-mono font-medium tabular-nums">
                                                            {formatMoney(item.payload.incomeCents)}
                                                        </span>
                                                    </div>
                                                )}
                                                <span
                                                    className="size-2.5 shrink-0 rounded-[2px]"
                                                    style={{backgroundColor: item.color}}
                                                />
                                                <span className="text-muted-foreground">
                                                    {chartConfig[name as keyof typeof chartConfig]?.label}
                                                </span>
                                                <span className="ml-auto font-mono font-medium tabular-nums">
                                                    {formatChartPercentage(value)}
                                                </span>
                                            </>
                                        )}
                                    />
                                }
                            />
                            <ChartLegend content={<ChartLegendContent />} />
                            <Bar
                                dataKey="needs"
                                stackId="allocation"
                                fill="var(--color-needs)"
                                maxBarSize={28}
                            />
                            <Bar
                                dataKey="wants"
                                stackId="allocation"
                                fill="var(--color-wants)"
                                maxBarSize={28}
                            />
                            <Bar
                                dataKey="savings"
                                stackId="allocation"
                                fill="var(--color-savings)"
                                maxBarSize={28}
                                radius={[5, 5, 0, 0]}
                            />
                        </BarChart>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    )
}

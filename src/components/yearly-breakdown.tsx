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
    onMonthSelect : (monthIndex : number) => void
}

function formatChartPercentage(value : unknown) {
    if (typeof value !== 'number') return '—'
    if (value > 0 && value < 1) return '<1%'

    return `${Math.round(value)}%`
}

function formatMoney(amountCents : number) {
    return currencyFormatter.format(amountCents / 100)
}

function calculatePercentage(amountCents : number, incomeCents : number) {
    if (incomeCents <= 0) return null

    return (amountCents / incomeCents) * 100
}

function getBucketAmountCents(
    month : YearlyMonthBreakdown,
    bucket : keyof typeof chartConfig
) {
    if (bucket === 'needs') return month.needsCents
    if (bucket === 'wants') return month.wantsCents

    return month.savingsCents
}

export default function YearlyBreakdown({
    data,
    disableNext,
    year,
    onNext,
    onPrevious,
    onReset,
    onMonthSelect
} : YearlyBreakdownProps) {
    const hasIncome = data.some(month => month.hasIncome)
    const hasActivity = data.some(month => month.hasActivity)
    const chartData = data.map(month => {
        const needs = calculatePercentage(month.needsCents, month.incomeCents)
        const wants = calculatePercentage(month.wantsCents, month.incomeCents)
        const savings = calculatePercentage(month.savingsCents, month.incomeCents)

        return {
            ...month,
            needs,
            wants,
            actualSavings: savings,
            savings: Math.max(savings ?? 0, 0)
        }
    })
    const chartDomain = chartData.reduce<[number, number]>((domain, month) => {
        const positiveTotal = (month.needs ?? 0)
            + (month.wants ?? 0)
            + month.savings

        return [
            0,
            Math.min(Math.max(domain[1], positiveTotal), 150)
        ]
    }, [0, 100])

    function handleMonthClick(monthIndex : number) {
        if (window.matchMedia('(min-width: 640px)').matches) return

        onMonthSelect(monthIndex)
    }

    return (
        <Card className="min-w-0">
            <CardHeader>
                <CardTitle>Yearly Overview</CardTitle>
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
                    <div className="flex h-56 items-center justify-center text-center sm:h-64">
                        <p className="text-xs text-muted-foreground">
                            {hasActivity
                                ? 'Add income to view this year'
                                : 'No activity this year'}
                        </p>
                    </div>
                ) : (
                    <div className="min-w-0 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:thin]">
                        <ChartContainer
                            config={chartConfig}
                            className="h-52 w-full min-w-[16.5rem] aspect-auto [-webkit-tap-highlight-color:transparent] [&_.recharts-bar-rectangle]:cursor-pointer [&_.recharts-layer]:!outline-none [&_.recharts-rectangle]:!outline-none [&_.recharts-surface]:!outline-none sm:h-64 sm:[&_.recharts-bar-rectangle]:cursor-default"
                        >
                            <BarChart
                                accessibilityLayer
                                data={chartData}
                                margin={{top: 8, right: 4, bottom: 0, left: 4}}
                            >
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="month"
                                    interval={0}
                                    tickLine={false}
                                    tickMargin={8}
                                    axisLine={false}
                                />
                                <YAxis
                                    hide
                                    domain={chartDomain}
                                    allowDataOverflow
                                />
                                <ReferenceLine y={0} />
                                <ChartTooltip
                                    cursor={false}
                                    content={
                                        <ChartTooltipContent
                                            className="!hidden min-w-60 sm:!grid"
                                            formatter={(value, name, item, index) => {
                                                const bucket = name as keyof typeof chartConfig
                                                const amountCents = getBucketAmountCents(
                                                    item.payload,
                                                    bucket
                                                )
                                                const percentage = bucket === 'savings'
                                                    ? item.payload.actualSavings
                                                    : value

                                                return (
                                                    <>
                                                        {index === 0 && (
                                                            <div className="mb-1 flex w-full basis-full justify-between border-b border-border/50 pb-1.5">
                                                                <span>Income:</span>
                                                                <span className="ml-auto font-mono font-medium tabular-nums">
                                                                    {formatMoney(item.payload.incomeCents)}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <span
                                                            className="size-2.5 shrink-0 rounded-[2px]"
                                                            style={{backgroundColor: item.color}}
                                                        />
                                                        <span>
                                                            {chartConfig[bucket]?.label}
                                                            {' '}
                                                            <span className="text-muted-foreground">
                                                                ({formatChartPercentage(percentage)})
                                                            </span>
                                                        </span>
                                                        <span className="ml-auto font-mono font-medium tabular-nums">
                                                            {formatMoney(amountCents)}
                                                        </span>
                                                    </>
                                                )
                                            }}
                                        />
                                    }
                                />
                                <ChartLegend content={<ChartLegendContent />} />
                                <Bar
                                    dataKey="needs"
                                    stackId="allocation"
                                    fill="var(--color-needs)"
                                    maxBarSize={28}
                                    onClick={bar => handleMonthClick(bar.originalDataIndex)}
                                />
                                <Bar
                                    dataKey="wants"
                                    stackId="allocation"
                                    fill="var(--color-wants)"
                                    maxBarSize={28}
                                    onClick={bar => handleMonthClick(bar.originalDataIndex)}
                                />
                                <Bar
                                    dataKey="savings"
                                    stackId="allocation"
                                    fill="var(--color-savings)"
                                    maxBarSize={28}
                                    onClick={bar => handleMonthClick(bar.originalDataIndex)}
                                />
                            </BarChart>
                        </ChartContainer>
                        <div className="sm:hidden">
                            {data.map((month, index) => month.hasIncome && (
                                <button
                                    type="button"
                                    className="sr-only focus:not-sr-only focus:fixed focus:left-1/2 focus:top-20 focus:z-50 focus:-translate-x-1/2 focus:rounded-lg focus:bg-popover focus:px-3 focus:py-2 focus:text-sm focus:shadow-md focus:ring-2 focus:ring-ring"
                                    key={month.month}
                                    onClick={() => onMonthSelect(index)}
                                >
                                    View {month.month} {year} monthly overview
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

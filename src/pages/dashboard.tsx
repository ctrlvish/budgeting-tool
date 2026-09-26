import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { addMonths, format, isSameMonth, startOfMonth, subMonths } from 'date-fns'
import type { Category, Transaction } from '@/types'
import { db } from '@/lib/db'
import { getDashboardYear, getSpendingBudget } from '@/lib/dashboard-summary'
import { DashboardError, DashboardLoading } from '@/components/dashboard-state'
import PeriodNavigation from '@/components/period-navigation'
import MonthlyComparison from '@/components/monthly-comparison'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface DashboardProps {
    onLogTransaction : (date : string) => void
}

const emptyTransactions : Transaction[] = []
const emptyCategories : Category[] = []
const money = (cents : number) => new Intl.NumberFormat('en-AU', {
    style: 'currency', currency: 'AUD'
}).format(cents / 100)
const availablePattern = 'repeating-linear-gradient(135deg, var(--muted), var(--muted) 3px, var(--card) 3px, var(--card) 6px)'

export default function Dashboard({ onLogTransaction } : DashboardProps) {
    const [loadAttempt, setLoadAttempt] = useState(0)
    const [selectedMonth, setSelectedMonth] = useState(() => startOfMonth(new Date()))
    const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear())
    const liveData = useLiveQuery(async () => {
        try {
            const [transactions, categories, settings] = await Promise.all([
                db.transactions.toArray(),
                db.categories.toArray(),
                db.budgetSettings.get('#budget-settings')
            ])
            return { transactions, categories, settings, error: false }
        } catch (error) {
            console.error('Failed to load dashboard data', error)
            return { transactions: emptyTransactions, categories: emptyCategories, settings: undefined, error: true }
        }
    }, [loadAttempt], null)
    const transactions = liveData?.transactions ?? emptyTransactions
    const categories = liveData?.categories ?? emptyCategories
    const overviewYear = selectedMonth.getFullYear()
    const overview = useMemo(() => getDashboardYear(transactions, categories, overviewYear), [transactions, categories, overviewYear])
    const comparison = useMemo(() => getDashboardYear(transactions, categories, selectedYear), [transactions, categories, selectedYear])
    const month = overview.months[selectedMonth.getMonth()]
    const budget = getSpendingBudget(month, liveData?.settings)
    const hasIncome = month.incomeCents > 0
    const totalSavings = useMemo(() => {
        const categoryMap = new Map(categories.map(category => [category.id, category]))
        return transactions.reduce((balance, transaction) => {
            if (transaction.type === 'income') return balance + transaction.amountCents
            return categoryMap.get(transaction.categoryId)?.bucket === 'savings' ? balance : balance - transaction.amountCents
        }, liveData?.settings?.startingSavingsBalanceCents ?? 0)
    }, [transactions, categories, liveData?.settings?.startingSavingsBalanceCents])
    const buckets = [
        { id: 'needs', name: 'Needs', amount: month.needs, target: budget.needsTarget, ratio: budget.ratios.needs, color: 'var(--bucket-needs)' },
        { id: 'wants', name: 'Wants', amount: month.wants, target: budget.wantsTarget, ratio: budget.ratios.wants, color: 'var(--bucket-wants)' },
        { id: 'savings', name: 'Savings', amount: month.savings, target: budget.savingsTarget, ratio: budget.ratios.savings, color: 'var(--bucket-savings)' }
    ]
    const segments = [
        ...buckets.map(bucket => ({ ...bucket, amount: bucket.id === 'savings' ? budget.reservedSavings : bucket.amount })),
        { id: 'uncategorized', name: 'Uncategorized', amount: month.uncategorized, color: 'var(--muted-foreground)' },
        { id: 'available', name: 'Available', amount: Math.max(0, budget.remainingCents), color: availablePattern }
    ].filter(segment => segment.amount > 0)

    function selectMonth(date : Date) {
        setSelectedMonth(startOfMonth(date))
    }

    return (
        <main className="mx-auto grid w-full max-w-6xl gap-8 px-3 py-6 sm:px-6 sm:py-10">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="font-heading text-2xl font-medium tracking-tight">Dashboard</h1>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span>{format(selectedMonth, 'MMMM yyyy')}</span>
                    <PeriodNavigation
                        disableNext={selectedMonth >= startOfMonth(new Date())}
                        nextLabel="Next month"
                        previousLabel="Previous month"
                        onNext={() => selectMonth(addMonths(selectedMonth, 1))}
                        onPrevious={() => selectMonth(subMonths(selectedMonth, 1))}
                        onReset={() => selectMonth(new Date())}
                        resetLabel="Reset to current month"
                        showReset={!isSameMonth(selectedMonth, new Date())}
                    />
                </div>
            </header>
            {liveData === null ? <DashboardLoading /> : liveData.error ? (
                <DashboardError onRetry={() => setLoadAttempt(attempt => attempt + 1)} />
            ) : (
                <>
                    <Card className="min-w-0 [--card-spacing:--spacing(5)] sm:[--card-spacing:--spacing(7)]">
                        <CardContent>
                            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                                <div className="min-w-0">
                                    <h2 className="text-sm text-muted-foreground">{budget.remainingCents < 0 ? 'Over budget' : 'Left to spend'}</h2>
                                    <p className="my-2 break-words font-heading text-5xl leading-tight tracking-tighter tabular-nums sm:text-6xl lg:text-7xl">
                                        {hasIncome || month.hasActivity ? money(budget.remainingCents) : '—'}
                                    </p>
                                    {hasIncome ? (
                                        <p className="text-xs text-muted-foreground">
                                            After reserving {money(budget.reservedSavings)} for savings
                                        </p>
                                    ) : (
                                        <Button
                                            variant="link"
                                            className="h-auto max-w-full justify-start p-0 text-xs font-normal whitespace-normal text-muted-foreground underline underline-offset-4 hover:text-foreground"
                                            onClick={() => onLogTransaction(format(isSameMonth(selectedMonth, new Date()) ? new Date() : selectedMonth, 'yyyy-MM-dd'))}
                                        >
                                            Log income to see your budget
                                        </Button>
                                    )}
                                </div>
                                <dl className="grid gap-3 text-sm sm:min-w-56">
                                    {[['Income', month.incomeCents], ['Spent', month.spentCents], ['Savings target', budget.savingsTarget]].map(([label, value]) => (
                                        <div className="flex justify-between gap-6" key={label}><dt className="text-muted-foreground">{label}</dt><dd className="tabular-nums">{money(Number(value))}</dd></div>
                                    ))}
                                </dl>
                            </div>
                            <div className="mt-7 flex h-6 gap-0.5 overflow-hidden rounded-sm bg-muted" role="img" aria-label={segments.length ? segments.map(segment => `${segment.name}: ${money(segment.amount)}`).join(', ') : 'No income or spending logged'}>
                                {segments.map(segment => <span key={segment.id} style={{ flex: segment.amount, background: segment.color }} />)}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
                                {segments.map(segment => (
                                    <span className="flex items-center gap-1.5" key={segment.id}>
                                        <i aria-hidden="true" className="size-2.5 rounded-xs" style={{ background: segment.color }} />
                                        {segment.name}
                                        <b className="font-medium text-foreground">{hasIncome ? `${Math.round(segment.amount / month.incomeCents * 1000) / 10}%` : money(segment.amount)}</b>
                                    </span>
                                ))}
                            </div>
                            {budget.remainingCents < 0 && <p className="mt-3 text-xs text-muted-foreground">Spending and reserved savings exceed logged income by {money(-budget.remainingCents)}.</p>}
                        </CardContent>
                    </Card>

                    <section aria-labelledby="distribution-heading" className="min-w-0">
                        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                            <h2 id="distribution-heading" className="text-base font-medium">Current distribution</h2>
                        </div>
                        <Card className="grid gap-0 divide-y py-0 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                            {buckets.map(bucket => {
                                const isSavings = bucket.id === 'savings'
                                const left = bucket.target - bucket.amount
                                const amount = isSavings ? budget.reservedSavings : Math.abs(left)
                                const progress = bucket.target > 0 ? Math.min(100, bucket.amount / bucket.target * 100) : bucket.amount > 0 ? 100 : 0
                                return (
                                    <CardContent key={bucket.id} className="min-w-0 py-3 sm:py-4">
                                            <div className="mb-2 flex items-center justify-between gap-2 text-xs">
                                                <h3 className="font-medium">{bucket.name}</h3>
                                                <span className="text-muted-foreground">{bucket.ratio}% target</span>
                                            </div>
                                            <div className="flex flex-wrap items-baseline gap-2">
                                                <span className={`break-all font-heading text-xl tracking-tight tabular-nums ${!isSavings && left < 0 ? 'text-destructive' : ''}`}>{money(amount)}</span>
                                                <span className="text-xs text-muted-foreground">{isSavings ? 'reserved' : left < 0 ? 'over' : 'left'}</span>
                                            </div>
                                            <div className="mb-2 mt-2 h-1 overflow-hidden rounded-xs bg-muted" role="img" aria-label={`${bucket.name}: ${money(bucket.amount)} ${isSavings ? 'contributed' : 'spent'} of ${money(bucket.target)} target`}>
                                                <span className="block h-full" style={{ width: `${progress}%`, background: bucket.color }} />
                                            </div>
                                            <div className="flex flex-wrap justify-between gap-1 text-xs text-muted-foreground"><span>{money(bucket.amount)} {isSavings ? 'contributed' : 'spent'}</span><span>of {money(bucket.target)}</span></div>
                                    </CardContent>
                                )
                            })}
                        </Card>
                        <div className="mt-4 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                            <span>Total savings <span className="ml-1 tabular-nums text-foreground">{money(totalSavings)}</span></span>
                            {month.uncategorized > 0 && <span>Includes {money(month.uncategorized)} in uncategorized spending.</span>}
                        </div>
                    </section>

                    <MonthlyComparison data={comparison} year={selectedYear} onYearChange={setSelectedYear} />
                </>
            )}
        </main>
    )
}

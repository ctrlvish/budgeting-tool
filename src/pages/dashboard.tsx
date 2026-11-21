import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { addMonths, format, isSameMonth, startOfMonth, subMonths } from 'date-fns'
import type { Category, Transaction, TransactionType } from '@/types'
import { db } from '@/lib/db'
import { getDashboardYear, getSpendingBudget } from '@/lib/dashboard-summary'
import { DashboardError, DashboardLoading } from '@/components/dashboard-state'
import PeriodNavigation from '@/components/period-navigation'
import MonthlyComparison from '@/components/monthly-comparison'
import DashboardFairy from '@/components/dashboard-fairy'
import { Card, CardContent } from '@/components/ui/card'

interface DashboardProps {
    onLogTransaction : (date : string, initialType? : TransactionType) => void
}

const emptyTransactions : Transaction[] = []
const emptyCategories : Category[] = []
const money = (cents : number) => new Intl.NumberFormat('en-AU', {
    style: 'currency', currency: 'AUD'
}).format(cents / 100)

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
        { id: 'savings', name: 'Savings', amount: month.totalSavingsCents, target: budget.savingsTarget, ratio: budget.ratios.savings, color: 'var(--bucket-savings)' }
    ]
    const segments = [
        ...buckets,
        { id: 'uncategorized', name: 'Uncategorized', amount: month.uncategorized, color: 'var(--muted-foreground)' }
    ].filter(segment => segment.amount > 0)
    const barTotal = Math.max(month.incomeCents, segments.reduce((total, segment) => total + segment.amount, 0))

    function selectMonth(date : Date) {
        setSelectedMonth(startOfMonth(date))
    }

    return (
        <main className="app-page dashboard-page">
            <header className="page-heading flex flex-wrap items-center justify-between gap-5">
                <h1>Dashboard</h1>
                <div className="dashboard-period flex flex-wrap items-center gap-2 text-sm">
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
                    <Card className="dashboard-overview min-w-0">
                        <CardContent>
                            <div className="overview-layout">
                                <div className="min-w-0">
                                    <h2 className="text-sm text-muted-foreground">{!hasIncome ? 'No income logged' : budget.remainingCents < 0 ? 'Shortfall' : 'Left to spend'}</h2>
                                    <div className="balance-with-fairy">
                                        <p className={`balance-amount ${hasIncome && budget.remainingCents < 0 ? "is-shortfall" : ""}`}>
                                            {hasIncome ? money(Math.abs(budget.remainingCents)) : month.hasActivity ? money(month.spentCents) : '—'}
                                        </p>
                                        <div className="dashboard-fairy"><DashboardFairy /></div>
                                    </div>
                                    {!hasIncome && (
                                        <div className="income-prompt">
                                            {month.hasActivity && <p className="text-sm text-muted-foreground">spent this month</p>}
                                            <p className="income-explanation">
                                                <button type="button" className="income-link" aria-haspopup="dialog"
                                                    onClick={() => onLogTransaction(format(isSameMonth(selectedMonth, new Date()) ? new Date() : selectedMonth, 'yyyy-MM-dd'), 'income')}
                                                >Log income</button>{' '}to calculate your budget.
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <dl className="overview-totals">
                                    {[['Income', month.incomeCents], ['Spent', month.spentCents], ['Savings + unspent', month.totalSavingsCents], ['Savings target', hasIncome ? budget.savingsTarget : null]].map(([label, value]) => (
                                        <div className="flex justify-between gap-6" key={label}><dt className="text-muted-foreground">{label}</dt><dd className="tabular-nums">{value === null ? '—' : money(Number(value))}</dd></div>
                                    ))}
                                </dl>
                            </div>
                            <div className="money-flow" role="img" aria-label={segments.length ? segments.map(segment => `${segment.name}: ${money(segment.amount)}`).join(', ') : 'No income or spending logged'}>
                                {segments.map(segment => <span key={segment.id} style={{ flex: segment.amount, background: segment.color }} />)}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
                                {segments.map(segment => (
                                    <span className="flex items-center gap-1.5" key={segment.id}>
                                        <i aria-hidden="true" className="size-2.5 rounded-xs" style={{ background: segment.color }} />
                                        {segment.name}
                                        <b className="font-medium text-foreground">{hasIncome && barTotal ? `${Math.round(segment.amount / barTotal * 1000) / 10}%` : money(segment.amount)}</b>
                                    </span>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <section aria-labelledby="distribution-heading" className="min-w-0">
                        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                            <h2 id="distribution-heading" className="text-base font-medium">Current distribution</h2>
                        </div>
                        <div className="budget-buckets">
                            {buckets.map(bucket => {
                                const isSavings = bucket.id === 'savings'
                                const left = bucket.target - bucket.amount
                                const amount = !hasIncome ? (isSavings ? month.savings : bucket.amount) : isSavings ? bucket.amount : Math.abs(left)
                                const progress = bucket.target > 0 ? Math.min(100, bucket.amount / bucket.target * 100) : bucket.amount > 0 ? 100 : 0
                                return (
                                    <article key={bucket.id} className={`budget-bucket bucket-${bucket.id}`}>
                                            <div className="mb-2 flex items-center justify-between gap-2 text-xs">
                                                <h3 className="font-medium">{bucket.name}</h3>
                                                <span className="text-muted-foreground">{hasIncome ? `${bucket.ratio}% target` : 'Awaiting income'}</span>
                                            </div>
                                            <div className="bucket-amount-line">
                                                <span className={`bucket-amount ${hasIncome && !isSavings && left < 0 ? 'text-destructive' : ''}`}>{money(amount)}</span>
                                                <span className="text-xs text-muted-foreground">{!hasIncome ? (isSavings ? 'transferred' : 'spent') : isSavings ? 'saved' : left < 0 ? 'over' : 'left'}</span>
                                            </div>
                                            {hasIncome && <div className="mb-2 mt-2 h-1 overflow-hidden rounded-xs bg-muted" role="img" aria-label={`${bucket.name}: ${money(bucket.amount)} ${isSavings ? 'saved' : 'spent'} of ${money(bucket.target)} target`}>
                                                <span className="block h-full" style={{ width: `${progress}%`, background: bucket.color }} />
                                            </div>}
                                            {hasIncome && <div className="flex flex-wrap justify-between gap-1 text-xs text-muted-foreground"><span>{isSavings ? `${money(month.savings)} transferred · ${money(month.unspentCents)} unspent` : `${money(bucket.amount)} spent`}</span><span>of {money(bucket.target)} target</span></div>}
                                    </article>
                                )
                            })}
                        </div>
                        <div className="mt-4 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                            <span>Estimated net position <span className="ml-1 tabular-nums text-foreground">{money(totalSavings)}</span></span>
                            {month.uncategorized > 0 && <span>Includes {money(month.uncategorized)} in uncategorized spending.</span>}
                        </div>
                    </section>

                    <MonthlyComparison data={comparison} year={selectedYear} onYearChange={setSelectedYear} />
                </>
            )}
        </main>
    )
}

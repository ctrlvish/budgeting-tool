import { useState, useEffect, useMemo } from "react"
import type { Transaction, Category } from '../types'
import { db } from "@/lib/db"
import { addMonths, format, isSameMonth, subMonths } from "date-fns"
import { Maximize2Icon } from "lucide-react"
import CategoryBreakdown from "@/components/category-breakdown"
import {
    DashboardError,
    DashboardLoading
} from "@/components/dashboard-state"
import PeriodNavigation from "@/components/period-navigation"
import YearlyBreakdown from "@/components/yearly-breakdown"
import { getYearlyBreakdown } from "@/lib/yearly-breakdown"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { 
    Card,
    CardAction,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
 } from "@/components/ui/card"

interface DashboardProps {
    revision : number
    onLogTransaction : () => void
}

interface MonthlyIncomeDescriptionProps {
    incomeCents : number
    monthLabel : string
    onLogIncome : () => void
}

const currencyFormatter = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD'
})

function formatMoney(amountCents : number) {
    return currencyFormatter.format(amountCents / 100)
}

function formatSignedMoney(amountCents : number) {
    const absoluteAmount = formatMoney(Math.abs(amountCents))

    if (amountCents === 0) return absoluteAmount

    return `${amountCents > 0 ? '+' : '-'}${absoluteAmount}`
}

function MonthlyIncomeDescription({
    incomeCents,
    monthLabel,
    onLogIncome
} : MonthlyIncomeDescriptionProps) {
    return (
        <>
            <span>{monthLabel}</span>
            <span aria-hidden="true">·</span>
            {incomeCents > 0 ? (
                <span>
                    Income{' '}
                    <span className="font-mono font-medium tabular-nums text-foreground/70">
                        {formatMoney(incomeCents)}
                    </span>
                </span>
            ) : (
                <button
                    type="button"
                    className="cursor-pointer bg-transparent! text-xs underline underline-offset-4 transition-colors hover:bg-transparent! hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={onLogIncome}
                >
                    Log income
                </button>
            )}
        </>
    )
}


export default function Dashboard({
    revision,
    onLogTransaction
} : DashboardProps){

    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [startingSavingsBalanceCents, setStartingSavingsBalanceCents] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [loadAttempt, setLoadAttempt] = useState(0)
    const [selectedMonth, setSelectedMonth] = useState(() => new Date())
    const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear())
    const [isMonthlyOverviewExpanded, setIsMonthlyOverviewExpanded] = useState(false)
    const monthKey = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, "0")}`

    useEffect(() => {

        let isActive = true

        Promise.all([
            db.transactions.toArray(),
            db.categories.toArray(),
            db.budgetSettings.toArray()
        ])
            .then(([transactions, categories, budgetSettings]) => {
                if (!isActive) return

                setTransactions(transactions)
                setCategories(categories)
                setStartingSavingsBalanceCents(
                    budgetSettings[0]?.startingSavingsBalanceCents ?? 0
                )
                setError('')
            })
        
            .catch(error => {
                if (!isActive) return

                console.error('failed to load dashboard data', error)
                setError('Could not load dashboard')
            })
            .finally(() => {
                if (!isActive) return

                setIsLoading(false)
            })
        return () => {
            isActive = false
        }
    }, [revision, loadAttempt])

    function handleRetry() {
        setIsLoading(true)
        setError('')
        setLoadAttempt(attempt => attempt + 1)
    }


    const monthFilteredTransactions = useMemo(() => {
        return transactions.filter(transaction =>
            transaction.date.startsWith(monthKey)
        )
    }, [transactions, monthKey])

    const monthlyIncomeCents = useMemo(() => {
        return monthFilteredTransactions.filter(transaction => 
            transaction.type === 'income'
        ).reduce((acc, curr) => acc + curr.amountCents, 0)
    }, [monthFilteredTransactions])

    const categoryMap = useMemo(() => {
        const map = new Map<string, Category>()

        for (const category of categories) {
            map.set(category.id, category)
        }

        return map
    }, [categories])

    const savingsChangeCents = useMemo(() => {
        return transactions.reduce((total, transaction) => {
            if (transaction.type === 'income') {
                return total + transaction.amountCents
            }

            const bucket = categoryMap.get(transaction.categoryId)?.bucket

            if (bucket === 'needs' || bucket === 'wants') {
                return total - transaction.amountCents
            }

            return total
        }, 0)
    }, [transactions, categoryMap])

    const currentSavingsBalanceCents = startingSavingsBalanceCents + savingsChangeCents


    const monthlyNeedsCents = useMemo(() => {
        return monthFilteredTransactions.filter(transaction => {
            const category = categoryMap.get(transaction.categoryId)
            return transaction.type === 'expense' 
                && category?.bucket === 'needs'
        }).reduce((total, transaction) => {
            return total + transaction.amountCents
        }, 0)
    }, [monthFilteredTransactions, categoryMap])

    const monthlyWantsCents = useMemo(() => {
        return monthFilteredTransactions.filter(transaction => {
            const category = categoryMap.get(transaction.categoryId)
            return transaction.type === 'expense' 
                && category?.bucket === 'wants'
        }).reduce((total, transaction) => {
            return total + transaction.amountCents
        }, 0)
    }, [monthFilteredTransactions, categoryMap])

    const monthlyExplicitSavingsCents = useMemo(() => {
        return monthFilteredTransactions.filter(transaction => {
            const category = categoryMap.get(transaction.categoryId)
            return transaction.type === 'expense' 
                && category?.bucket === 'savings'
        }).reduce((total, transaction) => {
            return total + transaction.amountCents
        }, 0)
    }, [monthFilteredTransactions, categoryMap])

    const leftoverCents = monthlyIncomeCents - monthlyNeedsCents - monthlyWantsCents - monthlyExplicitSavingsCents

    const monthlySavingsCents = monthlyExplicitSavingsCents + leftoverCents
    
    function calculatePercentage(amountCents: number, incomeCents: number) {
        if (incomeCents <= 0) return null

        return (amountCents / incomeCents) * 100
    }

    const monthlyNeedsPercentage = calculatePercentage(monthlyNeedsCents, monthlyIncomeCents)
    const monthlyWantsPercentage = calculatePercentage(monthlyWantsCents, monthlyIncomeCents)
    const monthlySavingsPercentage = calculatePercentage(monthlySavingsCents, monthlyIncomeCents)

    const monthlyCategoryTotals = useMemo(() => {
        const totals = new Map<string, number>()

        for (const transaction of monthFilteredTransactions){
            if (transaction.type !== 'expense') continue

            const previousTotal = totals.get(transaction.categoryId) ?? 0

            totals.set(
                transaction.categoryId, 
                previousTotal + transaction.amountCents
            )
        }
        return totals
    }, [monthFilteredTransactions])

    const monthlyCategoryEntries = Array.from(
        monthlyCategoryTotals.entries()
    )

    const monthlyCategoryRows = monthlyCategoryEntries.flatMap(
        ([categoryId, amountCents]) => {
            const category = categoryMap.get(categoryId)

            if (!category?.bucket) return []

            return [{
                id: categoryId,
                name: category.name,
                bucket: category.bucket,
                amountCents,
                percentage: calculatePercentage(
                    amountCents,
                    monthlyIncomeCents
                )
            }]
        }
    )

    const sortedMonthlyCategoryRows = [...monthlyCategoryRows]
        .sort((a, b) => b.amountCents - a.amountCents)

    const monthlyCategoriesByBucket = {
        needs: sortedMonthlyCategoryRows.filter(
            row => row.bucket === 'needs'
        ),
        wants: sortedMonthlyCategoryRows.filter(
            row => row.bucket === 'wants'
        ),
        savings: sortedMonthlyCategoryRows.filter(
            row => row.bucket === 'savings'
        )
    }

    if (leftoverCents !== 0) {
        monthlyCategoriesByBucket.savings.push({
            id: 'leftover',
            name: leftoverCents > 0
                ? 'Leftover'
                : 'Drawn from savings',
            bucket: 'savings',
            amountCents: leftoverCents,
            percentage: calculatePercentage(
                leftoverCents,
                monthlyIncomeCents
            )
        })
    }

    const monthLabel = format(selectedMonth, 'MMMM yyyy')
    const isCurrentMonth = isSameMonth(selectedMonth, new Date())
    const currentYear = new Date().getFullYear()

    const yearlyData = useMemo(() => {
        return getYearlyBreakdown(transactions, categoryMap, selectedYear)
    }, [transactions, categoryMap, selectedYear])

    const monthlyBucketSections = [
        {
            id: 'needs',
            label: 'Needs',
            percentage: monthlyNeedsPercentage,
            rows: monthlyCategoriesByBucket.needs
        },
        {
            id: 'wants',
            label: 'Wants',
            percentage: monthlyWantsPercentage,
            rows: monthlyCategoriesByBucket.wants
        },
        {
            id: 'savings',
            label: 'Savings',
            percentage: monthlySavingsPercentage,
            rows: monthlyCategoriesByBucket.savings
        }
    ].filter(section => section.rows.length > 0)

    function handleYearlyMonthSelect(monthIndex : number) {
        setSelectedMonth(new Date(selectedYear, monthIndex, 1))
        setIsMonthlyOverviewExpanded(true)
    }

    function handleLogIncome() {
        setIsMonthlyOverviewExpanded(false)
        onLogTransaction()
    }


    return (
    <main className='mx-auto grid w-full max-w-4xl gap-4 px-3 py-6 sm:gap-6 sm:px-4 sm:py-10'>
        <header className="space-y-1">
            <h1 className='font-heading text-2xl font-semibold tracking-tight sm:text-3xl'>Dashboard</h1>
            <p className='text-sm text-muted-foreground'>Your budget at a glance</p>
        </header>
        {isLoading ? (
            <DashboardLoading />
        ) : error ? (
            <DashboardError onRetry={handleRetry} />
        ) : (
            <>
                <Card className='gap-1' aria-label="Total Savings">
                    <CardHeader>
                        <CardTitle>Total Savings</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className={`font-heading text-3xl tracking-tight tabular-nums ${
                                currentSavingsBalanceCents < 0
                                    ? 'text-destructive'
                                    : 'text-foreground'
                            }`}>
                                {formatMoney(currentSavingsBalanceCents)}
                            </p>
                        </div>
                        <div className="grid gap-0.5 text-xs text-muted-foreground/85 sm:text-right">
                            <p>
                                Started at{' '}
                                <span className="tabular-nums text-foreground/65">
                                    {formatMoney(startingSavingsBalanceCents)}
                                </span>
                            </p>
                            <p>
                                <span className="tabular-nums text-foreground/65">
                                    {formatSignedMoney(savingsChangeCents)}
                                </span>
                                {' '}from logged savings
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <div>
                    <Card className="min-w-0">
                        <CardHeader className={isMonthlyOverviewExpanded ? "invisible" : undefined}>
                            <CardTitle>Monthly Overview</CardTitle>
                            <CardDescription className="flex flex-wrap items-baseline gap-x-1.5">
                                <MonthlyIncomeDescription
                                    incomeCents={monthlyIncomeCents}
                                    monthLabel={monthLabel}
                                    onLogIncome={handleLogIncome}
                                />
                            </CardDescription>
                            <CardAction>
                                <div className="flex items-center gap-0.5 sm:gap-1">
                                    <PeriodNavigation
                                        disableNext={isCurrentMonth}
                                        nextLabel="Next month"
                                        previousLabel="Previous month"
                                        onNext={() => {
                                            setSelectedMonth(month => addMonths(month, 1))
                                        }}
                                        onPrevious={() => {
                                            setSelectedMonth(month => subMonths(month, 1))
                                        }}
                                        onReset={() => setSelectedMonth(new Date())}
                                        resetLabel="Reset to current month"
                                        showReset={!isCurrentMonth}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        className="size-9 !bg-transparent hover:!bg-transparent hover:text-muted-foreground sm:size-7 dark:!bg-transparent dark:hover:!bg-transparent"
                                        aria-label="Expand monthly overview"
                                        onClick={() => setIsMonthlyOverviewExpanded(true)}
                                    >
                                        <Maximize2Icon />
                                    </Button>
                                </div>
                            </CardAction>
                        </CardHeader>
                        <CardContent className={isMonthlyOverviewExpanded ? "invisible" : undefined}>
                            <CategoryBreakdown
                                hasIncome={monthlyIncomeCents > 0}
                                sections={monthlyBucketSections}
                            />
                        </CardContent>
                    </Card>
                </div>
                <YearlyBreakdown
                    data={yearlyData}
                    disableNext={selectedYear >= currentYear}
                    year={selectedYear}
                    onNext={() => setSelectedYear(year => year + 1)}
                    onPrevious={() => setSelectedYear(year => year - 1)}
                    onReset={() => setSelectedYear(currentYear)}
                    onMonthSelect={handleYearlyMonthSelect}
                />
                <Dialog
                    open={isMonthlyOverviewExpanded}
                    onOpenChange={setIsMonthlyOverviewExpanded}
                >
                    <DialogContent className="grid h-3/4 w-10/12 grid-rows-[auto_minmax(0,1fr)] gap-0 p-0 sm:max-h-160 sm:max-w-xl">
                        <DialogHeader className="border-b p-4 sm:p-6">
                            <DialogTitle className="pr-8 text-lg">
                                Monthly Overview
                            </DialogTitle>
                            <div className="flex items-center justify-between gap-3">
                                <DialogDescription className="flex flex-wrap items-baseline gap-x-1.5">
                                    <MonthlyIncomeDescription
                                        incomeCents={monthlyIncomeCents}
                                        monthLabel={monthLabel}
                                        onLogIncome={handleLogIncome}
                                    />
                                </DialogDescription>
                                <PeriodNavigation
                                    disableNext={isCurrentMonth}
                                    nextLabel="Next month"
                                    previousLabel="Previous month"
                                    onNext={() => {
                                        setSelectedMonth(month => addMonths(month, 1))
                                    }}
                                    onPrevious={() => {
                                        setSelectedMonth(month => subMonths(month, 1))
                                    }}
                                    onReset={() => setSelectedMonth(new Date())}
                                    resetLabel="Reset to current month"
                                    showReset={!isCurrentMonth}
                                />
                            </div>
                        </DialogHeader>
                        <div className="min-h-0 p-4 sm:p-6">
                            <CategoryBreakdown
                                expanded
                                hasIncome={monthlyIncomeCents > 0}
                                sections={monthlyBucketSections}
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            </>
        )}
    </main>)
}

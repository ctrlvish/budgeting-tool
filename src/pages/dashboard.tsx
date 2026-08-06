import { useState, useEffect, useMemo } from "react"
import type { Transaction, Category, BudgetSetting } from '../types'
import { db } from "@/lib/db"
import { format } from "date-fns"
import CategoryBreakdown from "@/components/category-breakdown"
import { 
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
 } from "@/components/ui/card"

interface DashboardProps {
    revision : number

}


export default function Dashboard({revision}: DashboardProps){

    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [budgetSettings, setBudgetSettings] = useState<BudgetSetting | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [selectedMonth, setSelectedMonth] = useState(() => new Date())
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
                setBudgetSettings(budgetSettings[0] ?? null)
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
    }, [revision])


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


    return (
    <main className='mx-auto grid w-full max-w-4xl gap-6 px-4 py-10'>
        <header className="space-y-1">
            <h1 className='font-heading text-3xl font-semibold tracking-tight'>Dashboard</h1>
            <p className='text-sm text-muted-foreground'>Your budget at a glance</p>
        </header>
        <Card>
            <CardHeader>
                <CardTitle>Monthly Overview</CardTitle>
                <CardDescription>{monthLabel}</CardDescription>
            </CardHeader>
            <CardContent>
                <CategoryBreakdown sections={monthlyBucketSections} />
            </CardContent>
        </Card>
    </main>)
}

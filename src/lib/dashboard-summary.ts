import type { BudgetSetting, Category, Transaction } from '../types'

export type DashboardGroup = 'needs' | 'wants' | 'savings' | 'uncategorized'

export const dashboardGroups : { id : DashboardGroup, label : string }[] = [
    { id: 'needs', label: 'Needs' },
    { id: 'wants', label: 'Wants' },
    { id: 'uncategorized', label: 'Uncategorized' },
    { id: 'savings', label: 'Savings' }
]

export function getDashboardYear(transactions : Transaction[], categories : Category[], year : number) {
    const categoryMap = new Map(categories.map(category => [category.id, category]))
    const months = Array.from({ length: 12 }, () => ({
        incomeCents: 0,
        spentCents: 0,
        needs: 0,
        wants: 0,
        savings: 0,
        uncategorized: 0,
        hasActivity: false
    }))
    const rows = new Map<string, {
        id : string
        name : string
        group : DashboardGroup
        values : number[]
    }>()

    for (const category of categories) {
        if (category.type !== 'expense') continue
        rows.set(category.id, {
            id: category.id,
            name: category.name,
            group: category.bucket ?? 'uncategorized',
            values: Array<number>(12).fill(0)
        })
    }

    for (const transaction of transactions) {
        const monthIndex = Number(transaction.date.slice(5, 7)) - 1
        if (Number(transaction.date.slice(0, 4)) !== year || monthIndex < 0 || monthIndex > 11) continue
        const month = months[monthIndex]
        month.hasActivity = true
        if (transaction.type === 'income') {
            month.incomeCents += transaction.amountCents
            continue
        }

        const category = categoryMap.get(transaction.categoryId)
        const group = category?.bucket ?? 'uncategorized'
        month[group] += transaction.amountCents
        if (group !== 'savings') month.spentCents += transaction.amountCents

        const row = rows.get(transaction.categoryId) ?? {
            id: transaction.categoryId,
            name: category?.name ?? 'Unknown category',
            group,
            values: Array<number>(12).fill(0)
        }
        row.values[monthIndex] += transaction.amountCents
        rows.set(transaction.categoryId, row)
    }

    return {
        months: months.map(month => ({
            ...month,
            unspentCents: month.incomeCents - month.spentCents - month.savings,
            totalSavingsCents: month.incomeCents - month.spentCents
        })),
        rows: [...rows.values()].sort((a, b) => a.name.localeCompare(b.name))
    }
}

export function getSpendingBudget(
    month : ReturnType<typeof getDashboardYear>['months'][number],
    settings? : Pick<BudgetSetting, 'needs' | 'wants' | 'savings'>
) {
    const ratios = settings ?? { needs: 50, wants: 30, savings: 20 }
    const needsTarget = Math.round(month.incomeCents * ratios.needs / 100)
    const savingsTarget = Math.round(month.incomeCents * ratios.savings / 100)
    // Assign rounding remainder to wants so targets always reconcile to income.
    const wantsTarget = month.incomeCents - needsTarget - savingsTarget
    const reservedSavings = Math.max(savingsTarget, month.savings)

    return {
        ratios,
        needsTarget,
        wantsTarget,
        savingsTarget,
        reservedSavings,
        remainingCents: month.incomeCents - month.spentCents - reservedSavings
    }
}

import type { Category, Transaction } from "@/types"

const monthLabels = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
]

interface MonthTotals {
    incomeCents : number
    needsCents : number
    wantsCents : number
    hasActivity : boolean
}

export interface YearlyMonthBreakdown {
    month : string
    incomeCents : number
    needsCents : number
    wantsCents : number
    savingsCents : number
    hasActivity : boolean
    hasIncome : boolean
}

export function getYearlyBreakdown(
    transactions : Transaction[],
    categoryMap : Map<string, Category>,
    year : number
) : YearlyMonthBreakdown[] {
    const months : MonthTotals[] = monthLabels.map(() => ({
        incomeCents: 0,
        needsCents: 0,
        wantsCents: 0,
        hasActivity: false
    }))

    for (const transaction of transactions) {
        const transactionYear = Number(transaction.date.slice(0, 4))
        const monthIndex = Number(transaction.date.slice(5, 7)) - 1

        if (
            transactionYear !== year ||
            monthIndex < 0 ||
            monthIndex > 11
        ) {
            continue
        }

        const month = months[monthIndex]
        month.hasActivity = true

        if (transaction.type === 'income') {
            month.incomeCents += transaction.amountCents
            continue
        }

        const bucket = categoryMap.get(transaction.categoryId)?.bucket

        if (bucket === 'needs') {
            month.needsCents += transaction.amountCents
        }

        if (bucket === 'wants') {
            month.wantsCents += transaction.amountCents
        }
    }

    return months.map((month, index) => {
        if (month.incomeCents <= 0) {
            return {
                month: monthLabels[index],
                incomeCents: month.incomeCents,
                needsCents: month.needsCents,
                wantsCents: month.wantsCents,
                savingsCents: month.incomeCents - month.needsCents - month.wantsCents,
                hasActivity: month.hasActivity,
                hasIncome: false
            }
        }

        return {
            month: monthLabels[index],
            incomeCents: month.incomeCents,
            needsCents: month.needsCents,
            wantsCents: month.wantsCents,
            savingsCents: month.incomeCents - month.needsCents - month.wantsCents,
            hasActivity: month.hasActivity,
            hasIncome: true
        }
    })
}

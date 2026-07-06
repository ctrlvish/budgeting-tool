import Dexie, {type Table} from 'dexie'
import type {Category, BudgetSetting, RecurringExpense, Transaction} from '../types'

const defaultCategories : Category[] = [
    {
        id : 'rent',
        name : 'Rent',
        bucket : 'needs'
    },
    {
        id : 'groceries',
        name : 'Groceries',
        bucket : 'needs'
    },
    {
        id : 'bills',
        name : 'Bills',
        bucket : 'needs'
    },
    {
        id : 'transport',
        name : 'Transport',
        bucket : 'needs'
    },
    {
        id : 'food',
        name : 'Food',
        bucket : 'needs'
    },
    {
        id : 'medical',
        name : 'Medical',
        bucket : 'needs'
    },
    {
        id : 'activities',
        name : 'Activities',
        bucket : 'wants'
    },
    {
        id : 'shopping',
        name : 'Shopping',
        bucket : 'wants'
    },
    {
        id : 'self-care',
        name : 'Self-care',
        bucket : 'wants'
    },
    {
        id : 'eating-out',
        name : 'Eating out',
        bucket : 'wants'
    },
    {
        id : 'subscriptions',
        name : 'Subscriptions',
        bucket : 'wants'
    },
    {
        id : 'salary',
        name : 'Salary',
        bucket : 'savings'
    },
    {
        id : 'stocks',
        name : 'Stocks',
        bucket : 'savings'
    },
    {
        id : 'tax-returns',
        name : 'Tax returns',
        bucket : 'savings'
    }
]

const defaultRecurringExpenses : RecurringExpense[] = [
    {
        id : 'rent',
        name : 'Rent',
        amountCents : 150000,
        bucket : 'needs',
        categoryId : 'rent'
    },
    {
        id : 'bills',
        name : 'Bills',
        amountCents : 10000,
        bucket : 'needs',
        categoryId : 'bills'
    },
    {
        id : 'netflix',
        name : 'Netflix',
        amountCents : 1700,
        bucket : 'wants',
        categoryId : 'subscriptions'
    }
]

export class BudgetDatabase extends Dexie {
    categories! : Table<Category>
    budgetSettings! : Table<BudgetSetting>
    recurringExpenses! : Table<RecurringExpense>
    transactions! : Table<Transaction>

    constructor() {
        super('budget-db')
        this.version(1).stores({
            categories : 'id, bucket',
            budgetSettings : '++autoId',
            recurringExpenses : 'id, categoryId',
            transactions : 'id, date, categoryId, recurringExpenseId'
        })

        this.on('populate', async () => {
            await this.categories.bulkAdd(defaultCategories)
            await this.recurringExpenses.bulkAdd(defaultRecurringExpenses)
        })
    }
}

export const db = new BudgetDatabase()

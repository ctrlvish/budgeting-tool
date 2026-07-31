import Dexie, {type Table} from 'dexie'
import type {Category, BudgetSetting, RecurringTransaction, Transaction} from '../types'

const defaultCategories : Category[] = [
    {
        id : 'rent',
        name : 'Rent',
        type: 'expense',
        bucket : 'needs'
    },
    {
        id : 'groceries',
        name : 'Groceries',
        type: 'expense',
        bucket : 'needs'
    },
    {
        id : 'bills',
        name : 'Bills',
        type: 'expense',
        bucket : 'needs'
    },
    {
        id : 'transport',
        name : 'Transport',
        type: 'expense',
        bucket : 'needs'
    },
    {
        id : 'food',
        name : 'Food',
        type: 'expense',
        bucket : 'needs'
    },
    {
        id : 'medical',
        name : 'Medical',
        type: 'expense',
        bucket : 'needs'
    },
    {
        id : 'activities',
        name : 'Activities',
        type: 'expense',
        bucket : 'wants'
    },
    {
        id : 'shopping',
        name : 'Shopping',
        type: 'expense',
        bucket : 'wants'
    },
    {
        id : 'self-care',
        name : 'Self-care',
        type: 'expense',
        bucket : 'wants'
    },
    {
        id : 'eating-out',
        name : 'Eating out',
        type: 'expense',
        bucket : 'wants'
    },
    {
        id : 'subscriptions',
        name : 'Subscriptions',
        type: 'expense',
        bucket : 'wants'
    },
    {
        id : 'salary',
        name : 'Salary',
        type: 'income'
    },
    {
        id : 'stocks',
        name : 'Stocks',
        type: 'expense',
        bucket: 'savings'

    },
    {
        id : 'tax-returns',
        name : 'Tax returns',
        type: 'income'
    }
]

const defaultRecurringTransactions : RecurringTransaction[] = [
    {
        id : 'rent',
        name : 'Rent',
        amountCents : 150000,
        categoryId : 'rent',
    },
    {
        id : 'salary',
        name : 'Salary',
        amountCents : 420000,
        categoryId : 'salary'
    },
    {
        id : 'netflix',
        name : 'Netflix',
        amountCents : 1700,
        categoryId : 'subscriptions'
    }
]

export class BudgetDatabase extends Dexie {
    categories! : Table<Category>
    budgetSettings! : Table<BudgetSetting>
    recurringExpenses! : Table<RecurringTransaction>
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
            await this.recurringExpenses.bulkAdd(defaultRecurringTransactions)
        })
    }
}

export const db = new BudgetDatabase()

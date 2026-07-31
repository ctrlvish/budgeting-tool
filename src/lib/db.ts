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
    recurringTransactions! : Table<RecurringTransaction>
    transactions! : Table<Transaction>

    constructor() {
        super('budget-db')
        this.version(1).stores({
            categories : 'id, bucket',
            budgetSettings : '++autoId',
            recurringExpenses : 'id, categoryId',
            transactions : 'id, date, categoryId, recurringExpenseId'
        })

        this.version(2).stores({
            categories : 'id, type, bucket',
            budgetSettings : '++autoId',
            recurringExpenses : 'id, categoryId',
            recurringTransactions : 'id, categoryId',
            transactions : 'id, type, date, categoryId, recurringExpenseId, recurringTransactionId'
        }).upgrade(async schemaTransaction => {
            const categories = schemaTransaction.table<Category>('categories')
            const transactions = schemaTransaction.table<{
                categoryId : string
                type? : Transaction['type']
                recurringExpenseId? : string
                recurringTransactionId? : string
            }>('transactions')
            const previousRecurringTransactions = await schemaTransaction
                .table<RecurringTransaction>('recurringExpenses')
                .toArray()

            if (previousRecurringTransactions.length > 0) {
                await schemaTransaction
                    .table<RecurringTransaction>('recurringTransactions')
                    .bulkPut(previousRecurringTransactions)
            }

            await categories.toCollection().modify(category => {
                if (category.id === 'salary' || category.id === 'tax-returns') {
                    category.type = 'income'
                    delete category.bucket
                } else {
                    category.type = 'expense'
                }
            })

            const incomeCategoryIds = new Set(
                (await categories.toArray())
                    .filter(category => category.type === 'income')
                    .map(category => category.id)
            )

            await transactions.toCollection().modify(transaction => {
                transaction.type = incomeCategoryIds.has(transaction.categoryId)
                    ? 'income'
                    : 'expense'

                if (transaction.recurringExpenseId) {
                    transaction.recurringTransactionId = transaction.recurringExpenseId
                    delete transaction.recurringExpenseId
                }
            })
        })

        this.version(3).stores({
            categories : 'id, type, bucket',
            budgetSettings : '++autoId',
            recurringExpenses : null,
            recurringTransactions : 'id, categoryId',
            transactions : 'id, type, date, categoryId, recurringTransactionId'
        })

        this.on('populate', async () => {
            await this.categories.bulkAdd(defaultCategories)
            await this.recurringTransactions.bulkAdd(defaultRecurringTransactions)
        })
    }
}

export const db = new BudgetDatabase()

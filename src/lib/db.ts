import Dexie, {type Table} from 'dexie'
import type {Category, BudgetSetting, RecurringExpense, Transaction} from '../types'

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
    }
}

export const db = new BudgetDatabase()
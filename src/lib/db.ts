import Dexie, {type Table} from 'dexie'
import type {Category, BudgetSetup, RecurringExpense, Transaction} from '../types'

export class BudgetDatabase extends Dexie {
    categories! : Table<Category>
    budgetSetup! : Table<BudgetSetup>
    recurringExpenses! : Table<RecurringExpense>
    transactions! : Table<Transaction>

    constructor() {
        super('budget-db')
        this.version(1).stores({
            categories : 'id, bucket',
            budgetSetup : '++autoId',
            recurringExpenses : 'id, categoryId',
            transactions : 'id, date, categoryId, recurringExpenseId'
        })
    }
}

export const db = new BudgetDatabase()
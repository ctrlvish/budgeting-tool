import Dexie, {type Table} from 'dexie'
import type {Category, BudgetSetting, TransactionTemplate, Transaction} from '../types'
import dexieCloud from 'dexie-cloud-addon'

const defaultCategories : Category[] = [
    {
        id : '#rent',
        name : 'Rent',
        type: 'expense',
        bucket : 'needs'
    },
    {
        id : '#groceries',
        name : 'Groceries',
        type: 'expense',
        bucket : 'needs'
    },
    {
        id : '#bills',
        name : 'Bills',
        type: 'expense',
        bucket : 'needs'
    },
    {
        id : '#transport',
        name : 'Transport',
        type: 'expense',
        bucket : 'needs'
    },
    {
        id : '#food',
        name : 'Food',
        type: 'expense',
        bucket : 'needs'
    },
    {
        id : '#medical',
        name : 'Medical',
        type: 'expense',
        bucket : 'needs'
    },
    {
        id : '#activities',
        name : 'Activities',
        type: 'expense',
        bucket : 'wants'
    },
    {
        id : '#shopping',
        name : 'Shopping',
        type: 'expense',
        bucket : 'wants'
    },
    {
        id : '#eating-out',
        name : 'Eating out',
        type: 'expense',
        bucket : 'wants'
    },
    {
        id : '#subscriptions',
        name : 'Subscriptions',
        type: 'expense',
        bucket : 'wants'
    },
    {
        id : '#salary',
        name : 'Salary',
        type: 'income'
    },
    {
        id : '#stocks',
        name : 'Stocks',
        type: 'expense',
        bucket: 'savings'

    },
    {
        id : '#tax-returns',
        name : 'Tax returns',
        type: 'income'
    }
]

export class BudgetDatabase extends Dexie {
    categories! : Table<Category>
    budgetSettings! : Table<BudgetSetting>
    transactionTemplates! : Table<TransactionTemplate>
    transactions! : Table<Transaction>

    constructor() {
        super('budgeting-tool-db', {
            addons: [dexieCloud]
        })
        this.version(1).stores({
            categories : 'id, type, bucket',
            budgetSettings : 'id',
            transactionTemplates : 'id, categoryId',
            transactions : 'id, type, date, categoryId, transactionTemplateId'
        })
        this.cloud.configure({
            databaseUrl: import.meta.env.VITE_DEXIE_CLOUD_URL,
            requireAuth: true
        })

        this.on('populate', () => {
            this.on('ready', async () => {
                await this.categories.bulkPut(defaultCategories)
            })
        })
    }
}

export const db = new BudgetDatabase()

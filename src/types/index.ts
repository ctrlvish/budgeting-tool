// data models
export type Bucket = 'needs' | 'wants' | 'savings'

export type TransactionType = 'income' | 'expense'

export type CategoryGroup = 'income' | Bucket

export interface Category {
    id : string
    name : string
    type : TransactionType
    bucket? : Bucket
}

export interface BudgetSetting {
    startingSavingsBalance : number
    needs : number //ratios
    wants : number
    savings : number
}

export interface RecurringExpense {
    id : string
    name : string
    amountCents : number
    categoryId : string
}

export interface Transaction {
    id : string
    date : string //iso string e.g 2026-06-22
    description : string
    categoryId : string
    amountCents : number
    recurringExpenseId? : string //to derive if its logged
    type : TransactionType

}

// data models
export type Bucket = 'needs' | 'wants' | 'savings'

export interface Category {
    id : string
    name : string
    bucket : Bucket
}

export interface BudgetSetting {
    monthlyIncome : number | null
    startingSavingsBalance : number | null
    needs : number | null //ratios
    wants : number | null
    savings : number | null
}

export interface RecurringExpense {
    id : string
    name : string
    amount: number
    bucket : Bucket
    categoryId : string
}

export interface Transaction {
    id : string
    date : string //iso string e.g 2026-06-22
    description : string
    categoryId : string
    amount : number
    recurringExpenseId? : string //to derive if its logged

}
// data models
export type Bucket = 'needs' | 'wants' | 'savings'

export interface Category {
    id : string
    name : string
    bucket : Bucket
}

export interface BudgetSetting {
    monthlyIncome : number
    startingSavingsBalance : number
    needs : number //ratios
    wants : number
    savings : number
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

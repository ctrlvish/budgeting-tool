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
    id: string
    startingSavingsBalanceCents : number
    needs : number //ratios
    wants : number
    savings : number
}

export interface TransactionTemplate {
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
    transactionTemplateId? : string //to derive if its logged from a template
    type : TransactionType

}

import {BudgetSetup, RecurringTransactions, Categories} from '../components'


export default function Settings(){

    return (
        <main className='mx-auto grid w-full max-w-4xl gap-6 px-4 py-10'>
            <header className="space-y-1">
                <h1 className='font-heading text-3xl font-semibold tracking-tight'>Settings</h1>
                <p className='text-sm text-muted-foreground'>Configure your budget, recurring transactions and categories</p>
            </header>
        
        <BudgetSetup />
        <RecurringTransactions />
        <Categories />
        </main>
    )
}

import {BudgetSetup, RecurringTransactions, Categories} from '../components'


export default function Settings(){

    return (
        <main className='mx-auto grid w-full max-w-4xl gap-4 px-3 py-6 sm:gap-6 sm:px-4 sm:py-10'>
            <header className="space-y-1">
                <h1 className='font-heading text-2xl font-semibold tracking-tight sm:text-3xl'>Settings</h1>
                <p className='text-sm text-muted-foreground'>Manage your budget and categories</p>
            </header>
            <BudgetSetup />
            <RecurringTransactions />
            <Categories />
        </main>
    )
}

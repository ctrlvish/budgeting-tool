import { BudgetSetup, TransactionTemplates, Categories, AccountSettings } from '../components'
import { Info } from 'lucide-react'

interface SettingsProps {
    onOpenHowTo : () => void
}

export default function Settings({onOpenHowTo} : SettingsProps){

    return (
        <main className='mx-auto grid w-full max-w-6xl gap-4 px-3 py-6 sm:gap-5 sm:px-6 sm:py-8'>
            <header className="space-y-1">
                <div className="flex items-center justify-between gap-3">
                    <h1 className='font-heading text-2xl font-semibold tracking-tight sm:text-3xl'>Settings</h1>
                    <button
                        type="button"
                        className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-muted-foreground underline underline-offset-4 transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={onOpenHowTo}
                    >
                        <Info className="size-3.5" />
                        How to use
                    </button>
                </div>
                <p className='text-sm text-muted-foreground'>Manage your budget and categories</p>
            </header>
            <div className="grid min-w-0 items-stretch gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-5">
                <AccountSettings />
                <BudgetSetup />
            </div>
            <div className="grid min-w-0 items-stretch gap-4 lg:grid-cols-2 lg:[&>[data-slot=card]]:h-[28rem] lg:gap-5">
                <Categories />
                <TransactionTemplates />
            </div>
        </main>
    )
}

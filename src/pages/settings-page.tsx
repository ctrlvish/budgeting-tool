import { BudgetSetup, TransactionTemplates, Categories, AccountSettings } from '../components'
import { ArrowDown, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import './settings.css'

interface SettingsProps {
    onOpenHowTo : () => void
}

const sections = [
    { id: 'budget', label: 'Budget' },
    { id: 'categories', label: 'Categories' },
    { id: 'templates', label: 'Shortcuts' },
    { id: 'account', label: 'Account' }
]

export default function Settings({ onOpenHowTo } : SettingsProps) {
    return (
        <main className="settings-page">
            <header className="settings-heading">
                <div>
                    <h1>Settings</h1>
                    <p>Your budget, organised your way.</p>
                </div>
                <Button type="button" variant="plain" onClick={onOpenHowTo}>
                    <Info className="size-4" /> How to use
                </Button>
            </header>

            <nav className="settings-index" aria-label="Settings sections">
                {sections.map(section => (
                    <a href={`#${section.id}`} key={section.id}>
                        {section.label}<ArrowDown aria-hidden="true" className="size-3" />
                    </a>
                ))}
            </nav>

            <section id="budget" className="settings-section" aria-labelledby="budget-section-title">
                <div className="settings-section-intro">
                    <h2 id="budget-section-title">Make a plan</h2>
                    <p>Give your income a place to go. Adjust the balance between needs, wants, and savings.</p>
                </div>
                <BudgetSetup />
            </section>

            <section id="categories" className="settings-section" aria-labelledby="categories-section-title">
                <div className="settings-section-intro">
                    <h2 id="categories-section-title">Keep things sorted</h2>
                    <p>Use categories that make sense to you. Select a category to rename or delete it.</p>
                </div>
                <Categories />
            </section>

            <section id="templates" className="settings-section" aria-labelledby="templates-section-title">
                <div className="settings-section-intro">
                    <h2 id="templates-section-title">Less typing next time</h2>
                    <p>Save the transactions you enter often. You choose when to log them.</p>
                </div>
                <TransactionTemplates />
            </section>

            <section id="account" className="settings-section" aria-labelledby="account-section-title">
                <div className="settings-section-intro">
                    <h2 id="account-section-title">Your devices</h2>
                    <p>Keep your budget on this device, or sign in to sync it across devices.</p>
                </div>
                <AccountSettings />
            </section>
        </main>
    )
}

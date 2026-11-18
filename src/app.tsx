import { useState } from 'react'
import AppHeader from './components/app-header'
import TransactionDialog from './components/transaction-dialog'
import { Route, Routes } from 'react-router'
import Dashboard from './pages/dashboard'
import Transactions from './pages/transactions'
import Settings from './pages/settings-page'
import PageTransition from './components/page-transition'
import type { Transaction, TransactionType } from './types'
import { useLocation } from 'react-router'
import { AnimatePresence } from 'motion/react'
import CloudAuthDialog from './components/cloud-auth-dialog'
import HowToDialog from './components/how-to-dialog'

const HOW_TO_SEEN_KEY = 'budgeting-tool-how-to-seen'

function App() {
    const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false)
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
    const [initialTransactionType, setInitialTransactionType] = useState<TransactionType | null>(null)
    const [initialTransactionDate, setInitialTransactionDate] = useState<string | null>(null)
    const [isHowToDialogOpen, setIsHowToDialogOpen] = useState(
        () => localStorage.getItem(HOW_TO_SEEN_KEY) !== 'true'
    )
    const location = useLocation()

    function openTransactionDialog() {
        setSelectedTransaction(null)
        setInitialTransactionDate(null)
        setInitialTransactionType(null)
        setIsTransactionDialogOpen(true)
    }

    function openTransactionDialogForDate(date : string, initialType? : TransactionType) {
        setSelectedTransaction(null)
        setInitialTransactionDate(date)
        setInitialTransactionType(initialType ?? null)
        setIsTransactionDialogOpen(true)
    }

    function openEditTransaction(transaction : Transaction) {
        setSelectedTransaction(transaction)
        setInitialTransactionDate(null)
        setInitialTransactionType(null)
        setIsTransactionDialogOpen(true)
    }

    function handleHowToOpenChange(open : boolean) {
        setIsHowToDialogOpen(open)

        if (!open) {
            localStorage.setItem(HOW_TO_SEEN_KEY, 'true')
        }
    }

    return (
        <div className="app-shell flex h-lvh flex-col overflow-hidden">
            <AppHeader onLogTransaction={openTransactionDialog} />
            <div className="relative isolate min-h-0 flex-1 overflow-hidden">
                <AnimatePresence mode="sync" initial={false}>
                    <PageTransition key={location.pathname}>
                        <Routes location={location}>
                            <Route
                                path="/"
                                element={
                                    <Dashboard
                                        onLogTransaction={openTransactionDialogForDate}
                                    />
                                }
                            />
                            <Route
                                path="/transactions"
                                element={
                                    <Transactions
                                        onLogTransaction={openTransactionDialog}
                                        onEditTransaction={openEditTransaction}
                                    />
                                }
                            />
                            <Route
                                path="/settings"
                                element={
                                    <Settings
                                        onOpenHowTo={() => setIsHowToDialogOpen(true)}
                                    />
                                }
                            />
                        </Routes>
                    </PageTransition>
                </AnimatePresence>
            </div>
            <TransactionDialog
                open={isTransactionDialogOpen}
                onOpenChange={setIsTransactionDialogOpen}
                transaction={selectedTransaction}
                initialType={initialTransactionType}
                initialDate={initialTransactionDate}
            />
            <CloudAuthDialog />
            <HowToDialog
                open={isHowToDialogOpen}
                onOpenChange={handleHowToOpenChange}
            />
        </div>
    )
}

export default App

import { useState } from 'react'
import AppHeader from './components/app-header'
import TransactionDialog from './components/transaction-dialog'
import { Route, Routes } from 'react-router'
import Dashboard from './pages/dashboard'
import Transactions from './pages/transactions'
import Settings from './pages/settings-page'
import PageTransition from './components/page-transition'
import type { Transaction } from './types'
import { useLocation } from 'react-router'
import { AnimatePresence } from 'motion/react'
import CloudAuthDialog from './components/cloud-auth-dialog'

function App() {
    const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false)
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
    const location = useLocation()

    function openTransactionDialog() {
        setSelectedTransaction(null)
        setIsTransactionDialogOpen(true)
    }

    function openEditTransaction(transaction : Transaction) {
      
        setSelectedTransaction(transaction)
        setIsTransactionDialogOpen(true)
    }

    const initialClipPath =
        location.pathname === '/settings'
            ? 'inset(0 0 100% 0)'
            : location.pathname === '/transactions'
                ? 'inset(0 0 0 100%)'
                : 'inset(0 100% 0 0)'

    return (
        <div className="flex h-dvh flex-col overflow-hidden">
            <AppHeader onLogTransaction={openTransactionDialog} />
            <div className="relative isolate min-h-0 flex-1 overflow-hidden">
                <AnimatePresence mode="sync" initial={false}>
                    <PageTransition
                        key={location.pathname}
                        initialClipPath={initialClipPath}
                    >
                        <Routes location={location}>
                            <Route
                                path="/"
                                element={
                                    <Dashboard
                                        onLogTransaction={openTransactionDialog}
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
                            <Route path="/settings" element={<Settings />} />
                        </Routes>
                    </PageTransition>
                </AnimatePresence>
            </div>
            <TransactionDialog
                open={isTransactionDialogOpen}
                onOpenChange={setIsTransactionDialogOpen}
                transaction={selectedTransaction}
            />
            <CloudAuthDialog />
        </div>
    )
}

export default App

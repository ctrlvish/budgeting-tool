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

function App() {
    const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false)
    const [transactionsRevision, setTransactionsRevision] = useState(0)
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
    const location = useLocation()

    function openTransactionDialog() {
        setSelectedTransaction(null)
        setIsTransactionDialogOpen(true)
    }

    function handleTransactionCreated() {
        setTransactionsRevision(previousRevision => previousRevision + 1)
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
        <div className="min-h-dvh pb-[calc(4rem+env(safe-area-inset-bottom))] sm:pb-0">
            <AppHeader onLogTransaction={openTransactionDialog} />
            <div className="relative isolate overflow-x-clip">
                <AnimatePresence mode="popLayout" initial={false}>
                    <PageTransition
                        key={location.pathname}
                        initialClipPath={initialClipPath}
                    >
                        <Routes location={location}>
                            <Route path="/" element={<Dashboard revision={transactionsRevision} />} />
                            <Route
                                path="/transactions"
                                element={
                                    <Transactions
                                        onLogTransaction={openTransactionDialog}
                                        revision={transactionsRevision}
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
                onCreated={handleTransactionCreated}
                transaction={selectedTransaction}
            />
        </div>
    )
}

export default App

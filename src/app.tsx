import { useState } from 'react'
import AppHeader from './components/app-header'
import TransactionDialog from './components/transaction-dialog'
import { Route, Routes } from 'react-router'
import Dashboard from './pages/dashboard'
import Transactions from './pages/transactions'
import Settings from './pages/settings-page'
import type { Transaction } from './types'
import { useLocation } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'

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

    const pageWipe =
        location.pathname === '/settings'
            ? {
                initial: { clipPath: 'inset(0 0 100% 0)' },
                animate: { clipPath: 'inset(0 0 0% 0)' },
            }
            : location.pathname === '/transactions'
                ? {
                    initial: { clipPath: 'inset(0 0 0 100%)' },
                    animate: { clipPath: 'inset(0 0 0 0)' },
                }
                : {
                    initial: { clipPath: 'inset(0 100% 0 0)' },
                    animate: { clipPath: 'inset(0 0 0 0)' },
                }

    return (
        <div className="min-h-dvh pb-[calc(4rem+env(safe-area-inset-bottom))] sm:pb-0">
            <AppHeader onLogTransaction={openTransactionDialog} />
            <div className="overflow-x-clip">
                <AnimatePresence mode="popLayout" initial={false}>
                <motion.div 
                    key={location.pathname}
                    initial={pageWipe.initial}
                    animate={pageWipe.animate}
                    exit={{ opacity: 0 }}
                    transition={{ 
                        duration: 0.4, 
                        ease: [0.22, 1, 0.36, 1] 
                    }}
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
                </motion.div>
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

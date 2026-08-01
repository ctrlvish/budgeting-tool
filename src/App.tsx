import { useState } from 'react'
import AppHeader from './components/app-header'
import TransactionDialog from './components/transaction-dialog'
import { Route, Routes } from 'react-router'
import Home from './pages/home'
import Transactions from './pages/transactions'
import Settings from './pages/settings'
import type { Transaction } from './types'

function App() {
    const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false)
    const [transactionsRevision, setTransactionsRevision] = useState(0)
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

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

    return (
        <div>
            <AppHeader onLogTransaction={openTransactionDialog} />

            <main>
                <Routes>
                    <Route path="/" element={<Home />} />
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
            </main>

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

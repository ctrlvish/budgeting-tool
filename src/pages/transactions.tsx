import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { 
    Card,
    CardHeader,
    CardContent
 } from "@/components/ui/card"
 import { 
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell
 } from "@/components/ui/table"
 import { db } from "@/lib/db"
 import type { Transaction, Category } from "@/types"

interface TransactionsProps {
    onLogTransaction : () => void
    revision : number
}

export default function Transactions({ onLogTransaction, revision } : TransactionsProps){

    const [error, setError] = useState('')
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [isLoading, setIsLoading] = useState(true)



    useEffect(() => {
        let isActive = true

        Promise.all([
            db.transactions.toArray(),
            db.categories.toArray()
        ])
            .then(([transactions, categories]) => {
                if (!isActive) return

                setTransactions(transactions)
                setCategories(categories)
            })
            .catch(error => {
                console.error('failed to load transactions', error)

                if (isActive) {
                    setError('Could not load transactions')
                }
            })
            .finally(() => {
                if (isActive) {
                    setIsLoading(false)
                }
            })

        return () => {
            isActive = false
        }
    }, [revision])

    return (
    <main className='mx-auto grid w-full max-w-4xl gap-6 px-4 py-10'>
        <header className="flex justify-between">
            <div className="space-y-1">
                <h1 className='font-heading text-3xl font-semibold tracking-tight'>Transactions</h1>
                <p className='text-sm text-muted-foreground'>Log and manage your income and spending here</p>
            </div>
            <div className="flex">
                <Button className='self-center' onClick={onLogTransaction}>
                    <Plus className="size-4" /> Log
                </Button>
            </div>
        </header>
        <Card>
            <CardHeader>
                {/* Search and filters go here */}
            </CardHeader>
            <CardContent>
                {error && <p>error: {error}</p>}
                {isLoading && <p>loading transactions...</p>}
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.map((transaction) => {

                            const category = categories.find(
                                category => transaction.categoryId === category.id
                            )

                            return (
                            <TableRow key={transaction.id}>
                                <TableCell className="font-medium">{transaction.date}</TableCell>
                                <TableCell>{transaction.description}</TableCell>
                                <TableCell>
                                    <p>{category?.name}</p>
                                    <p>{category?.bucket}</p>
                                </TableCell>
                                <TableCell className="text-right">{transaction.amountCents}</TableCell>
                            </TableRow>
                        )
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </main>
    )
}

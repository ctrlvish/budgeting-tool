import { db } from '../lib/db'
import { useState, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import type { RecurringTransaction, Category } from '../types'
import GroupedCategoryCombobox from '@/components/grouped-category-combobox'
import {
    Card,
    CardHeader,
    CardContent,
    CardFooter,
    CardDescription,
    CardTitle
} from './ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const currencyFormatter = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD'
})

function formatMoney(amountCents : number) {
    return currencyFormatter.format(amountCents / 100)
}

function getCategoryGroup(category : Category | undefined) {
    if (!category) return 'Unknown'

    return category.type === 'income' ? 'Income' : category.bucket ?? 'Unknown'
}

export default function RecurringTransactions() {
    const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [categoryId, setCategoryId] = useState<string | null>(null)
    const [name, setName] = useState('')
    const [amount, setAmount] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isAdding, setIsAdding] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    async function handleAdd(e : React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault()

        const trimmedName = name.trim()
        const amountNumber = Number(amount)
        const amountCents = Math.round(amountNumber * 100)

        if (!trimmedName) {
            setError('Please enter a name')
            return
        }

        if (!amount || !Number.isFinite(amountNumber) || amountNumber <= 0) {
            setError('Please enter an amount greater than 0')
            return
        }

        if (!categoryId) {
            setError('Please choose a category')
            return
        }

        const transaction : RecurringTransaction = {
            id: crypto.randomUUID(),
            name: trimmedName,
            amountCents,
            categoryId
        }

        setIsAdding(true)
        setError('')

        try {
            await db.recurringTransactions.add(transaction)
            setRecurringTransactions(previousTransactions => [
                ...previousTransactions,
                transaction
            ])
            setName('')
            setAmount('')
            setCategoryId(null)
            setError('')
        } catch (error) {
            console.error('failed to create recurring transaction', error)
            setError('Could not create recurring transaction')
        } finally {
            setIsAdding(false)
        }
    }

    async function handleDelete(id : string) {
        setDeletingId(id)

        try {
            await db.recurringTransactions.delete(id)
            setRecurringTransactions(previousTransactions =>
                previousTransactions.filter(transaction => transaction.id !== id)
            )
            setError('')
        } catch (error) {
            console.error('failed to delete recurring transaction', error)
            setError('Could not delete recurring transaction')
        } finally {
            setDeletingId(null)
        }
    }

    useEffect(() => {
        let isActive = true

        Promise.all([
            db.recurringTransactions.toArray(),
            db.categories.toArray()
        ])
            .then(([transactions, categories]) => {
                if (!isActive) return

                setRecurringTransactions(transactions)
                setCategories(categories)
            })
            .catch(error => {
                console.error('failed to load recurring transaction data', error)

                if (isActive) {
                    setError('Could not load recurring transactions')
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
    }, [])

    const isFormDisabled = isLoading || isAdding

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Recurring transactions</CardTitle>
                <CardDescription>Create templates for income and expenses you log often.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
                {isLoading ? (
                    <p className="text-sm text-muted-foreground">Loading recurring transactions...</p>
                ) : recurringTransactions.length === 0 ? (
                    <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                        No recurring transactions yet.
                    </p>
                ) : (
                    <ul className="divide-y rounded-lg border">
                        {recurringTransactions.map(transaction => {
                            const category = categories.find(
                                category => category.id === transaction.categoryId
                            )

                            return (
                                <li
                                    className="flex items-center justify-between gap-4 px-3 py-2.5"
                                    key={transaction.id}
                                >
                                    <div className="min-w-0">
                                        <p className="truncate font-medium">{transaction.name}</p>
                                        <p className="text-xs capitalize text-muted-foreground">
                                            {getCategoryGroup(category)}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2">
                                        <span className="font-medium tabular-nums">
                                            {formatMoney(transaction.amountCents)}
                                        </span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon-sm"
                                            onClick={() => handleDelete(transaction.id)}
                                            disabled={deletingId === transaction.id}
                                            aria-label={`Delete ${transaction.name}`}
                                        >
                                            <Trash2 />
                                        </Button>
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                )}

                <form id="recurring-transaction-form" className="grid gap-4 border-t pt-6" onSubmit={handleAdd}>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="grid gap-2">
                            <Label htmlFor="recurringTransactionName">Name</Label>
                            <Input
                                id="recurringTransactionName"
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                disabled={isFormDisabled}
                                placeholder="e.g. Rent"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="recurringTransactionAmount">Amount</Label>
                            <div className="relative">
                                <span
                                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
                                    aria-hidden="true"
                                >
                                    $
                                </span>
                                <Input
                                    className="pl-6"
                                    id="recurringTransactionAmount"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    disabled={isFormDisabled}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="recurringTransactionCategory">Category</Label>
                            <GroupedCategoryCombobox
                                categories={categories}
                                value={categoryId}
                                onValueChange={selectedCategoryId => {
                                    setCategoryId(selectedCategoryId)
                                    setError('')
                                }}
                                disabled={isFormDisabled}
                                id="recurringTransactionCategory"
                                placeholder="Choose category"
                            />
                        </div>
                    </div>
                </form>
            </CardContent>
            <CardFooter className="justify-between gap-4">
                <div className="min-h-5" aria-live="polite">
                    {error && (
                        <p className="text-sm font-medium text-destructive" role="alert">
                            {error}
                        </p>
                    )}
                </div>
                <Button
                    type="submit"
                    form="recurring-transaction-form"
                    className="px-4"
                    disabled={isFormDisabled}
                >
                    {isAdding ? 'Adding...' : 'Add recurring transaction'}
                </Button>
            </CardFooter>
        </Card>
    )
}

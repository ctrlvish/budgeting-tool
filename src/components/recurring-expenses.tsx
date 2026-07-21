import { db } from '../lib/db'
import { useState, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import type { RecurringExpense, Bucket, Category } from '../types'
import { 
    Card, 
    CardHeader,
    CardContent,
    CardDescription,
    CardTitle
} from "./ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"

const buckets : Bucket[] = ['needs', 'wants', 'savings']

const bucketItems = buckets.map(bucket => ({
    label: bucket.charAt(0).toUpperCase() + bucket.slice(1),
    value: bucket
}))

function formatMoney(amountCents : number) {
    return `$${(amountCents / 100).toFixed(2)}`
}

export default function RecurringExpenses() {
    const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([])
    const [bucket, setBucket] = useState<Bucket>('needs')
    const [categories, setCategories] = useState<Category[]>([])
    const [categoryId, setCategoryId] = useState<string | null>(null)
    const [name, setName] = useState('')
    const [amount, setAmount] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isAdding, setIsAdding] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const filteredCategories = categories.filter(category => category.bucket === bucket)

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

        const expense : RecurringExpense = {
            id: crypto.randomUUID(),
            name: trimmedName,
            amountCents,
            bucket,
            categoryId
        }

        setIsAdding(true)
        setError('')

        try {
            await db.recurringExpenses.add(expense)
            setRecurringExpenses(previousExpenses => [...previousExpenses, expense])
            setName('')
            setAmount('')
            setCategoryId(null)
            setError('')
        } catch (error) {
            console.error('failed to create recurring expense', error)
            setError('Could not create recurring expense')
        } finally {
            setIsAdding(false)
        }
    }

    function handleBucketChange(value : Bucket | null) {
        if (!value) return

        setBucket(value)
        setCategoryId(null)
    }

    async function handleDelete(id : string) {
        setDeletingId(id)

        try {
            await db.recurringExpenses.delete(id)
            setRecurringExpenses(previousExpenses => previousExpenses.filter(expense => expense.id !== id))
            setError('')
        } catch (error) {
            console.error('failed to delete recurring expense', error)
            setError('Could not delete recurring expense')
        } finally {
            setDeletingId(null)
        }
    }

    useEffect(() => {
        let isActive = true

        Promise.all([
            db.recurringExpenses.toArray(),
            db.categories.toArray()
        ])
            .then(([expenses, categories]) => {
                if (!isActive) return

                setRecurringExpenses(expenses)
                setCategories(categories)
            })
            .catch(error => {
                console.error('failed to load recurring expense data', error)

                if (isActive) {
                    setError('Could not load recurring expenses')
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
    const categoryItems = [
        { label: 'Choose category', value: null },
        ...filteredCategories.map(category => ({
            label: category.name,
            value: category.id
        }))
    ]
    
    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Recurring expenses</CardTitle>
                <CardDescription>Add expenses that repeat each month, such as rent or subscriptions.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
                {isLoading ? (
                    <p className="text-sm text-muted-foreground">Loading recurring expenses...</p>
                ) : recurringExpenses.length === 0 ? (
                    <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                        No recurring expenses yet.
                    </p>
                ) : (
                    <ul className="divide-y rounded-lg border">
                        {recurringExpenses.map(expense => (
                            <li className="flex items-center justify-between gap-4 px-3 py-2.5" key={expense.id}>
                                <div className="min-w-0">
                                    <p className="truncate font-medium">{expense.name}</p>
                                    <p className="text-xs capitalize text-muted-foreground">{expense.bucket}</p>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                    <span className="font-medium tabular-nums">{formatMoney(expense.amountCents)}</span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={() => handleDelete(expense.id)}
                                        disabled={deletingId === expense.id}
                                        aria-label={`Delete ${expense.name}`}
                                    >
                                        <Trash2 />
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                <form className="grid gap-4 border-t pt-6" onSubmit={handleAdd}>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="recurringExpenseName">Name</Label>
                            <Input
                                id="recurringExpenseName"
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                disabled={isFormDisabled}
                                placeholder="e.g. Rent"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="recurringExpenseAmount">Monthly amount</Label>
                            <Input
                                id="recurringExpenseAmount"
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

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="recurringExpenseBucket">Bucket</Label>
                            <Select
                                items={bucketItems}
                                value={bucket}
                                onValueChange={handleBucketChange}
                                disabled={isFormDisabled}
                            >
                                <SelectTrigger id="recurringExpenseBucket" className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Buckets</SelectLabel>
                                        {bucketItems.map(item => (
                                            <SelectItem key={item.value} value={item.value}>
                                                {item.label}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="recurringExpenseCategory">Category</Label>
                            <Select
                                items={categoryItems}
                                value={categoryId}
                                onValueChange={setCategoryId}
                                disabled={isFormDisabled || filteredCategories.length === 0}
                            >
                                <SelectTrigger id="recurringExpenseCategory" className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Categories</SelectLabel>
                                        {categoryItems.map(item => (
                                            <SelectItem key={item.value ?? 'placeholder'} value={item.value}>
                                                {item.label}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
                    <Button type="submit" disabled={isFormDisabled}>
                        {isAdding ? 'Adding...' : 'Add recurring expense'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}

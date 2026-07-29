import { useEffect, useState } from "react"
import type { Bucket, Category, Transaction } from "@/types"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

const bucketLabels : Record<Bucket, string> = {
    needs: 'Needs',
    wants: 'Wants',
    savings: 'Savings'
}

function getToday() {
    const now = new Date()
    const timezoneOffset = now.getTimezoneOffset() * 60_000

    return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 10)
}

interface TransactionDialogProps {
    open : boolean
    onOpenChange : (open : boolean) => void
    onCreated : () => void
}

export default function TransactionDialog({
    open,
    onOpenChange,
    onCreated
} : TransactionDialogProps) {
    const [categories, setCategories] = useState<Category[]>([])
    const [description, setDescription] = useState('')
    const [amount, setAmount] = useState('')
    const [date, setDate] = useState(getToday)
    const [categoryId, setCategoryId] = useState<string | null>(null)
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (!open) return

        let isActive = true

        db.categories.toArray()
            .then(categories => {
                if (isActive) {
                    setCategories(categories)
                }
            })
            .catch(error => {
                console.error('failed to load transaction categories', error)

                if (isActive) {
                    setError('Could not load categories')
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
    }, [open])

    function resetForm() {
        setDescription('')
        setAmount('')
        setDate(getToday())
        setCategoryId(null)
        setError('')
    }

    function handleOpenChange(nextOpen : boolean) {
        if (!nextOpen && isSaving) return

        if (!nextOpen) {
            resetForm()
        }

        onOpenChange(nextOpen)
    }

    async function handleSubmit(e : React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault()

        const trimmedDescription = description.trim()
        const amountNumber = Number(amount)
        const amountCents = Math.round(amountNumber * 100)

        if (!trimmedDescription) {
            setError('Please enter a description')
            return
        }

        if (!amount || !Number.isFinite(amountNumber) || amountNumber <= 0) {
            setError('Please enter an amount greater than 0')
            return
        }

        if (!date) {
            setError('Please choose a date')
            return
        }

        if (!categoryId) {
            setError('Please choose a category')
            return
        }

        const transaction : Transaction = {
            id: crypto.randomUUID(),
            date,
            description: trimmedDescription,
            categoryId,
            amountCents
        }

        setIsSaving(true)
        setError('')

        try {
            await db.transactions.add(transaction)
            resetForm()
            onCreated()
            onOpenChange(false)
        } catch (error) {
            console.error('failed to create transaction', error)
            setError('Could not save transaction')
        } finally {
            setIsSaving(false)
        }
    }

    const isFormDisabled = isLoading || isSaving
    const categoryItems = [
        { label: 'Choose category', value: null },
        ...categories.map(category => ({
            label: category.name,
            value: category.id
        }))
    ]

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Log transaction</DialogTitle>
                    <DialogDescription>Add a transaction to your budget.</DialogDescription>
                </DialogHeader>

                <form className="grid gap-4" onSubmit={handleSubmit}>
                    <div className="grid gap-2">
                        <Label htmlFor="transactionDescription">Description</Label>
                        <Input
                            id="transactionDescription"
                            type="text"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            disabled={isFormDisabled}
                            placeholder="e.g. Weekly groceries"
                            autoFocus
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="transactionAmount">Amount</Label>
                            <div className="relative">
                                <span
                                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
                                    aria-hidden="true"
                                >
                                    $
                                </span>
                                <Input
                                    className="pl-6"
                                    id="transactionAmount"
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
                            <Label htmlFor="transactionDate">Date</Label>
                            <Input
                                id="transactionDate"
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                disabled={isFormDisabled}
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="transactionCategory">Category</Label>
                        <Select
                            items={categoryItems}
                            value={categoryId}
                            onValueChange={setCategoryId}
                            disabled={isFormDisabled || categories.length === 0}
                        >
                            <SelectTrigger id="transactionCategory" className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {buckets.map(bucket => {
                                    const bucketCategories = categories.filter(
                                        category => category.bucket === bucket
                                    )

                                    if (bucketCategories.length === 0) return null

                                    return (
                                        <SelectGroup key={bucket}>
                                            <SelectLabel>{bucketLabels[bucket]}</SelectLabel>
                                            {bucketCategories.map(category => (
                                                <SelectItem key={category.id} value={category.id}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    )
                                })}
                            </SelectContent>
                        </Select>
                    </div>

                    {error && (
                        <p className="text-sm font-medium text-destructive" role="alert">
                            {error}
                        </p>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isFormDisabled}>
                            {isSaving ? 'Saving...' : 'Save transaction'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

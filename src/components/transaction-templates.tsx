import { db } from '../lib/db'
import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import type { TransactionTemplate, Category } from '../types'
import GroupedCategoryCombobox from '@/components/grouped-category-combobox'
import { MAX_TRANSACTION_AMOUNT_CENTS } from '@/lib/money'
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
import { toast } from 'sonner'
import { useLiveQuery } from 'dexie-react-hooks'

const currencyFormatter = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD'
})

const emptyTemplates : TransactionTemplate[] = []
const emptyCategories : Category[] = []

function formatMoney(amountCents : number) {
    return currencyFormatter.format(amountCents / 100)
}

function getCategoryGroup(category : Category | undefined) {
    if (!category) return 'Unknown'

    return category.type === 'income' ? 'Income' : category.bucket ?? 'Unknown'
}

export default function TransactionTemplates() {
    const [categoryId, setCategoryId] = useState<string | null>(null)
    const [name, setName] = useState('')
    const [amount, setAmount] = useState('')
    const [error, setError] = useState('')
    const [isAdding, setIsAdding] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const liveData = useLiveQuery(async () => {
        const [transactionTemplates, categories] = await Promise.all([
            db.transactionTemplates.toArray(),
            db.categories.toArray()
        ])

        return {
            transactionTemplates,
            categories
        }
    }, [], null)

const transactionTemplates =
    liveData?.transactionTemplates ?? emptyTemplates
const categories = liveData?.categories ?? emptyCategories
const isLoading = liveData === null

    function showError(message : string) {
        setError(message)
        toast.error(message)
    }

    async function handleAdd(e : React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault()

        const trimmedName = name.trim()
        const amountNumber = Number(amount)
        const amountCents = Math.round(amountNumber * 100)

        if (!trimmedName) {
            showError('Please enter a name')
            return
        }

        if (!amount || !Number.isFinite(amountNumber) || amountNumber <= 0) {
            showError('Please enter an amount greater than 0')
            return
        }

        if (amountCents > MAX_TRANSACTION_AMOUNT_CENTS) {
            showError('Amount cannot exceed $50,000,000')
            return
        }

        if (!categoryId) {
            showError('Please choose a category')
            return
        }

        const template : TransactionTemplate = {
            id: crypto.randomUUID(),
            name: trimmedName,
            amountCents,
            categoryId
        }

        setIsAdding(true)
        setError('')

        try {
            await db.transactionTemplates.add(template)
            setName('')
            setAmount('')
            setCategoryId(null)
            setError('')
            toast.success('Template added')
        } catch (error) {
            console.error('failed to create transaction template', error)
            showError('Couldn’t add template')
        } finally {
            setIsAdding(false)
        }
    }

    async function handleDelete(id : string) {
        setDeletingId(id)

        try {
            await db.transactionTemplates.delete(id)
            setError('')
            toast.success('Template deleted')
        } catch (error) {
            console.error('failed to delete transaction template', error)
            showError('Couldn’t delete template')
        } finally {
            setDeletingId(null)
        }
    }

    const isFormDisabled = isLoading || isAdding
    const isNameInvalid = error === 'Please enter a name'
    const isAmountInvalid = error === 'Please enter an amount greater than 0'
        || error === 'Amount cannot exceed $50,000,000'
    const isCategoryInvalid = error === 'Please choose a category'

    return (
        <Card className="w-full min-w-0">
            <CardHeader>
                <CardTitle>Transaction templates</CardTitle>
                <CardDescription>Save templates for transactions you log often</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
                {isLoading ? (
                    <p className="text-sm text-muted-foreground">Loading templates...</p>
                ) : transactionTemplates.length === 0 ? (
                    <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                        No templates yet.
                    </p>
                ) : (
                    <ul className="divide-y rounded-lg border">
                        {transactionTemplates.map(template => {
                            const category = categories.find(
                                category => category.id === template.categoryId
                            )

                            return (
                                <li
                                    className="flex items-center justify-between gap-3 px-3 py-2.5"
                                    key={template.id}
                                >
                                    <div className="min-w-0">
                                        <p className="truncate font-medium">{template.name}</p>
                                        <p className="text-xs capitalize text-muted-foreground">
                                            {getCategoryGroup(category)}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2">
                                        <span className="font-medium tabular-nums">
                                            {formatMoney(template.amountCents)}
                                        </span>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon-sm"
                                            className="size-9 !bg-transparent hover:!bg-transparent sm:size-7 dark:!bg-transparent dark:hover:!bg-transparent"
                                            onClick={() => handleDelete(template.id)}
                                            disabled={deletingId === template.id}
                                            aria-label={`Delete ${template.name}`}
                                        >
                                            <Trash2 />
                                        </Button>
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                )}

                <form id="transaction-template-form" className="grid gap-4 border-t pt-5 sm:pt-6" onSubmit={handleAdd}>
                    <div className="grid grid-cols-[minmax(0,4fr)_minmax(0,6fr)] gap-3 sm:grid-cols-3 sm:gap-4">
                        <div className="col-span-2 grid gap-2 sm:col-span-1">
                            <Label htmlFor="transactionTemplateName">Name</Label>
                            <Input
                                className="h-10 sm:h-8"
                                id="transactionTemplateName"
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                disabled={isFormDisabled}
                                placeholder="e.g. Rent"
                                aria-required="true"
                                aria-invalid={isNameInvalid}
                                aria-describedby={isNameInvalid ? 'transaction-template-error' : undefined}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="transactionTemplateAmount">Amount</Label>
                            <div className="relative">
                                <span
                                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
                                    aria-hidden="true"
                                >
                                    $
                                </span>
                                <Input
                                    className="h-10 pl-6 sm:h-8"
                                    id="transactionTemplateAmount"
                                    type="number"
                                    inputMode="decimal"
                                    min="0.01"
                                    max="50000000"
                                    step="0.01"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    disabled={isFormDisabled}
                                    placeholder="0.00"
                                    aria-required="true"
                                    aria-invalid={isAmountInvalid}
                                    aria-describedby={isAmountInvalid ? 'transaction-template-error' : undefined}
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="transactionTemplateCategory">Category</Label>
                            <GroupedCategoryCombobox
                                className="h-10 w-full sm:h-8"
                                categories={categories}
                                value={categoryId}
                                onValueChange={selectedCategoryId => {
                                    setCategoryId(selectedCategoryId)
                                    setError('')
                                }}
                                disabled={isFormDisabled}
                                id="transactionTemplateCategory"
                                placeholder="Choose category"
                                ariaRequired
                                ariaInvalid={isCategoryInvalid}
                                ariaDescribedBy={isCategoryInvalid ? 'transaction-template-error' : undefined}
                            />
                        </div>
                    </div>
                </form>
            </CardContent>
            <CardFooter className="justify-end">
                <div className="sr-only" aria-live="polite">
                    {error && (
                        <p id="transaction-template-error" role="alert">
                            {error}
                        </p>
                    )}
                </div>
                <Button
                    type="submit"
                    form="transaction-template-form"
                    variant="outline"
                    className="h-10 px-4 sm:h-8"
                    disabled={isFormDisabled}
                >
                    Add template
                </Button>
            </CardFooter>
        </Card>
    )
}

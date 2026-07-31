import { useEffect, useState } from "react"
import { CalendarIcon } from "lucide-react"
import type { Bucket, Category, Transaction, TransactionType } from "@/types"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput
} from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover"
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

function formatDisplayDate(date : Date | undefined) {
    if (!date) return ''

    return date.toLocaleDateString('en-AU', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    })
}

function formatStoredDate(date : Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

function isValidDate(date : Date | undefined) {
    return date !== undefined && !Number.isNaN(date.getTime())
}

function getToday() {
    return new Date()
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
    const [date, setDate] = useState<Date | undefined>(getToday)
    const [dateValue, setDateValue] = useState(() => formatDisplayDate(getToday()))
    const [calendarMonth, setCalendarMonth] = useState<Date | undefined>(getToday)
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
    const [categoryId, setCategoryId] = useState<string | null>(null)
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [transactionType, setTransactionType] = useState<TransactionType>('expense')

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
        const today = getToday()

        setDescription('')
        setAmount('')
        setDate(today)
        setDateValue(formatDisplayDate(today))
        setCalendarMonth(today)
        setIsDatePickerOpen(false)
        setCategoryId(null)
        setError('')
        setTransactionType('expense')
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
            date: formatStoredDate(date),
            description: trimmedDescription,
            categoryId,
            amountCents,
            type: transactionType
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
                    <DialogTitle>Log Income/Expense</DialogTitle>
                    <DialogDescription>Add income or expense to your budget.</DialogDescription>
                    <div className="flex justify-evenly">
                        <Button 
                            variant='ghost' 
                            type="button"
                            onClick={() => setTransactionType('expense')}
                        >Expense</Button>
                        <Button 
                            variant='ghost' 
                            type="button"
                            onClick={() => setTransactionType('income')}
                        >Income</Button>
                    </div>
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
                            <InputGroup>
                                <InputGroupInput
                                    id="transactionDate"
                                    value={dateValue}
                                    onChange={e => {
                                        const nextDate = new Date(e.target.value)

                                        setDateValue(e.target.value)
                                        setDate(isValidDate(nextDate) ? nextDate : undefined)

                                        if (isValidDate(nextDate)) {
                                            setCalendarMonth(nextDate)
                                        }
                                    }}
                                    onKeyDown={e => {
                                        if (e.key === 'ArrowDown') {
                                            e.preventDefault()
                                            setIsDatePickerOpen(true)
                                        }
                                    }}
                                    disabled={isFormDisabled}
                                    placeholder="29 July 2026"
                                />
                                <InputGroupAddon align="inline-end">
                                    <Popover
                                        open={isDatePickerOpen}
                                        onOpenChange={setIsDatePickerOpen}
                                    >
                                        <PopoverTrigger
                                            render={
                                                <InputGroupButton
                                                    id="transactionDatePicker"
                                                    variant="ghost"
                                                    size="icon-xs"
                                                    aria-label="Select date"
                                                    disabled={isFormDisabled}
                                                >
                                                    <CalendarIcon />
                                                    <span className="sr-only">Select date</span>
                                                </InputGroupButton>
                                            }
                                        />
                                        <PopoverContent
                                            className="w-auto overflow-hidden p-0"
                                            align="end"
                                            alignOffset={-8}
                                            sideOffset={10}
                                        >
                                            <Calendar
                                                mode="single"
                                                selected={date}
                                                month={calendarMonth}
                                                onMonthChange={setCalendarMonth}
                                                onSelect={selectedDate => {
                                                    setDate(selectedDate)
                                                    setDateValue(formatDisplayDate(selectedDate))
                                                    setIsDatePickerOpen(false)
                                                }}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </InputGroupAddon>
                            </InputGroup>
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
                            {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

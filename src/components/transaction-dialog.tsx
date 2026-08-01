import { useEffect, useState } from "react"
import { CalendarIcon } from "lucide-react"
import type { 
    Category, 
    CategoryGroup, 
    Transaction, 
    RecurringTransaction 
} from "@/types"
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog"
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
    Combobox,
    ComboboxCollection,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxGroup,
    ComboboxInput,
    ComboboxItem,
    ComboboxLabel,
    ComboboxList
} from "@/components/ui/combobox"

import { 
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue
 } from "./ui/select"

const categoryGroups : CategoryGroup[] = ['income', 'needs', 'wants', 'savings']

const categoryGroupLabels : Record<CategoryGroup, string> = {
    income: 'Income',
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

function formatStoredDate(date : Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

function parseStoredDate(dateStr : string): Date{
    const splitDate = dateStr.split('-').map(Number)
    return new Date(splitDate[0], splitDate[1] - 1, splitDate[2])
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
    transaction : Transaction | null
}

export default function TransactionDialog({
    open,
    onOpenChange,
    onCreated,
    transaction
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
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState('')
    const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([])
    const [recurringTransactionId, setRecurringTransactionId] =
    useState<string | null>(null)

    // logic to control if edit dialog is shown or create dialog is shown
    const isEditing = transaction !== null


    useEffect(() => {
        if (!open) return

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
    }, [open])

    useEffect(() => {
        if (!open || transaction === null) return
        const parsedDate = parseStoredDate(transaction.date)
        setDescription(transaction.description)
        setAmount((transaction.amountCents/100).toFixed(2))
        setDate(parsedDate)
        setDateValue(formatDisplayDate(parsedDate))
        setCalendarMonth(parsedDate)
        setCategoryId(transaction.categoryId)
        setRecurringTransactionId(transaction.recurringTransactionId ?? null)
    }, [open, transaction])

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
        setRecurringTransactionId(null)
    }

    function handleOpenChange(nextOpen : boolean) {
        if (!nextOpen && isSaving) return

        onOpenChange(nextOpen)
    }

    function handleOpenChangeComplete(nextOpen : boolean) {
        if (!nextOpen) {
            resetForm()
        }
    }

    function handleRecurringTransactionChange(value : string | null){
        setRecurringTransactionId(value)
        if (value === null) return
        
        const foundTransaction = recurringTransactions.find(transaction => value === transaction.id)
        if (!foundTransaction) return
        
        setDescription(foundTransaction.name)
        setAmount((foundTransaction.amountCents / 100).toFixed(2))
        setCategoryId(foundTransaction.categoryId)
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

        const selectedCategory = categories.find(category => category.id === categoryId)

        if (!selectedCategory) {
            setError('Please choose a valid category')
            return
        }

        const transactionData = {
            date: formatStoredDate(date),
            description: trimmedDescription,
            categoryId,
            amountCents,
            type: selectedCategory.type,
            recurringTransactionId: recurringTransactionId ?? undefined
        }


        setIsSaving(true)
        setError('')

        try {
            if (isEditing) {
                await db.transactions.update(transaction.id, transactionData)
            } else {
                await db.transactions.add({ id: crypto.randomUUID(), ...transactionData })
            }

            onCreated()
            onOpenChange(false)
        } catch (error) {
            console.error(
                isEditing ? 'failed to edit transaction' : 'failed to create transaction',
                error
            )
            setError('Could not save transaction')
        } finally {
            setIsSaving(false)
        }
    }

    async function handleTransactionDelete() {
        if (!transaction) return

        setIsDeleting(true)
        setDeleteError('')

        try {
            await db.transactions.delete(transaction.id)
            onCreated()
            setIsDeleteDialogOpen(false)
            onOpenChange(false)
        } catch (error) {
            console.error('failed to delete transaction', error)
            setDeleteError('Could not delete transaction')
        } finally {
            setIsDeleting(false)
        }
    }

    const isFormDisabled = isLoading || isSaving
    const recurringTransactionItems = [
        { label: 'Choose template (optional)', value: null },
        ...recurringTransactions.map(transaction => ({
            label: transaction.name,
            value: transaction.id
        }))
    ]

    const groupedCategories = categoryGroups
        .map(group => ({
            group,
            label: categoryGroupLabels[group],
            items: categories.filter(category => {
                if (group === 'income') {
                    return category.type === 'income'
                }

                return category.type === 'expense' && category.bucket === group
            })
        }))
        .filter(group => group.items.length > 0)

    return (
        <>
            <Dialog
                open={open}
                onOpenChange={handleOpenChange}
                onOpenChangeComplete={handleOpenChangeComplete}
            >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Edit Transaction' : 'Log Transaction'}
                    </DialogTitle>
                    {!isEditing && <DialogDescription>Add income or an expense to your budget.</DialogDescription>}
                </DialogHeader>

                <form className="grid gap-4" onSubmit={handleSubmit}>
                    {!isEditing && <div className="grid gap-2">
                        <Label htmlFor="transactionTemplate">Template</Label>
                        <Select
                            items={recurringTransactionItems}
                            value={recurringTransactionId}
                            onValueChange={handleRecurringTransactionChange}
                            disabled={isFormDisabled}
                            id="transactionTemplate"
                        >
                            <SelectTrigger id="transactionTemplate" className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Templates</SelectLabel>
                                    {recurringTransactionItems.map(item => (
                                        <SelectItem key={item.value} value={item.value}>
                                            {item.label}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>}
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
                        <Combobox
                            items={groupedCategories}
                            value={categories.find(category => category.id === categoryId) ?? null}
                            onValueChange={category => {
                                setCategoryId(category?.id ?? null)
                                setError('')
                            }}
                            itemToStringLabel={category => category.name}
                            itemToStringValue={category => category.id}
                            isItemEqualToValue={(category, value) => category.id === value.id}
                            disabled={isFormDisabled || categories.length === 0}
                            autoHighlight
                        >
                            <ComboboxInput
                                id="transactionCategory"
                                className="w-full"
                                placeholder="Assign a category"
                                disabled={isFormDisabled || categories.length === 0}
                            />
                            <ComboboxContent>
                                <ComboboxEmpty>No categories found.</ComboboxEmpty>
                                <ComboboxList>
                                    {(group : (typeof groupedCategories)[number]) => (
                                        <ComboboxGroup key={group.group} items={group.items}>
                                            <ComboboxLabel>{group.label}</ComboboxLabel>
                                            <ComboboxCollection>
                                                {(category : Category) => (
                                                    <ComboboxItem key={category.id} value={category}>
                                                        {category.name}
                                                    </ComboboxItem>
                                                )}
                                            </ComboboxCollection>
                                        </ComboboxGroup>
                                    )}
                                </ComboboxList>
                            </ComboboxContent>
                        </Combobox>
                        {!isLoading && categories.length === 0 && (
                            <p className="text-xs text-muted-foreground">
                                Add a category in Settings first.
                            </p>
                        )}
                    </div>

                    {error && (
                        <p className="text-sm font-medium text-destructive" role="alert">
                            {error}
                        </p>
                    )}

                    <DialogFooter>
                        {isEditing ? (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={() => {
                                    setDeleteError('')
                                    setIsDeleteDialogOpen(true)
                                }}
                                disabled={isSaving}
                            >
                                Delete
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                                disabled={isSaving}
                            >
                                Cancel
                            </Button>
                        )}
                        <Button type="submit" disabled={isFormDisabled}>
                            {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                    </DialogFooter>
                </form>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={isDeleteDialogOpen}
                onOpenChange={nextOpen => {
                    if (!nextOpen && isDeleting) return

                    setIsDeleteDialogOpen(nextOpen)

                    if (!nextOpen) {
                        setDeleteError('')
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
                        <AlertDialogDescription>
                            “{transaction?.description}” will be permanently deleted.
                        </AlertDialogDescription>
                        {deleteError && (
                            <p className="text-sm font-medium text-destructive" role="alert">
                                {deleteError}
                            </p>
                        )}
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            disabled={isDeleting}
                            onClick={handleTransactionDelete}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

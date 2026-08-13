import { useEffect, useState } from "react"
import { CalendarIcon } from "lucide-react"
import type { 
    Category, 
    Transaction, 
    TransactionTemplate
} from "@/types"
import { db } from "@/lib/db"
import { MAX_TRANSACTION_AMOUNT_CENTS } from "@/lib/money"
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
import GroupedCategoryCombobox from '@/components/grouped-category-combobox'
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
 } from "./ui/select"
import { toast } from "sonner"

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
    transaction : Transaction | null
}

export default function TransactionDialog({
    open,
    onOpenChange,
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
    const [transactionTemplates, setTransactionTemplates] = useState<TransactionTemplate[]>([])
    const [transactionTemplateId, setTransactionTemplateId] =
    useState<string | null>(null)

    // logic to control if edit dialog is shown or create dialog is shown
    const isEditing = transaction !== null

    function showError(message : string) {
        setError(message)
        toast.error(message)
    }


    useEffect(() => {
        if (!open) return

        let isActive = true

        Promise.all([
            db.transactionTemplates.toArray(),
            db.categories.toArray()
        ])
            .then(([templates, categories]) => {
                if (!isActive) return

                setTransactionTemplates(templates)
                setCategories(categories)

                if (transaction) {
                    const parsedDate = parseStoredDate(transaction.date)

                    setDescription(transaction.description)
                    setAmount((transaction.amountCents / 100).toFixed(2))
                    setDate(parsedDate)
                    setDateValue(formatDisplayDate(parsedDate))
                    setCalendarMonth(parsedDate)
                    setCategoryId(transaction.categoryId)
                    setTransactionTemplateId(transaction.transactionTemplateId ?? null)
                }
            })
            .catch(error => {
                console.error('failed to load transaction template data', error)

                if (isActive) {
                    showError('Couldn’t load transaction templates')
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
        setTransactionTemplateId(null)
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

    function handleTransactionTemplateChange(value : string | null){
        setTransactionTemplateId(value)
        if (value === null) return
        
        const foundTemplate = transactionTemplates.find(template => value === template.id)
        if (!foundTemplate) return
        
        setDescription(foundTemplate.name)
        setAmount((foundTemplate.amountCents / 100).toFixed(2))
        setCategoryId(foundTemplate.categoryId)
    }

    async function handleSubmit(e : React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault()

        const trimmedDescription = description.trim()
        const amountNumber = Number(amount)
        const amountCents = Math.round(amountNumber * 100)

        if (!trimmedDescription) {
            showError('Please enter a description')
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

        if (!date) {
            showError('Please choose a date')
            return
        }

        if (!categoryId) {
            showError('Please choose a category')
            return
        }

        const selectedCategory = categories.find(category => category.id === categoryId)

        if (!selectedCategory) {
            showError('Please choose a valid category')
            return
        }

        const transactionData = {
            date: formatStoredDate(date),
            description: trimmedDescription,
            categoryId,
            amountCents,
            type: selectedCategory.type,
            transactionTemplateId: transactionTemplateId ?? undefined
        }


        setIsSaving(true)
        setError('')

        try {
            if (isEditing) {
                await db.transactions.update(transaction.id, transactionData)
            } else {
                await db.transactions.add({ id: crypto.randomUUID(), ...transactionData })
            }

            onOpenChange(false)
            toast.success(isEditing ? 'Transaction updated' : 'Transaction added')
        } catch (error) {
            console.error(
                isEditing ? 'failed to edit transaction' : 'failed to create transaction',
                error
            )
            showError('Couldn’t save transaction')
        } finally {
            setIsSaving(false)
        }
    }

    async function handleTransactionDelete() {
        if (!transaction) return

        setIsDeleting(true)

        try {
            await db.transactions.delete(transaction.id)
            setIsDeleteDialogOpen(false)
            onOpenChange(false)
            toast.success('Transaction deleted')
        } catch (error) {
            console.error('failed to delete transaction', error)
            toast.error('Couldn’t delete transaction')
        } finally {
            setIsDeleting(false)
        }
    }

    const isFormDisabled = isLoading || isSaving
    const isDescriptionInvalid = error === 'Please enter a description'
    const isAmountInvalid = error === 'Please enter an amount greater than 0'
        || error === 'Amount cannot exceed $50,000,000'
    const isDateInvalid = error === 'Please choose a date'
    const isCategoryInvalid = error === 'Please choose a category'
        || error === 'Please choose a valid category'
    const transactionTemplateItems = [
        { label: 'Choose template (optional)', value: null },
        ...transactionTemplates.map(template => ({
            label: template.name,
            value: template.id
        }))
    ]

    return (
        <>
            <Dialog
                open={open}
                onOpenChange={handleOpenChange}
                onOpenChangeComplete={handleOpenChangeComplete}
            >
            <DialogContent className="max-h-[calc(100dvh-1.5rem)] max-w-[calc(100%-3rem)] gap-5 overflow-y-auto [&_[data-slot=dialog-close]]:size-9 sm:max-h-[calc(100dvh-2rem)] sm:max-w-sm sm:gap-4 sm:**:data-[slot=dialog-close]:size-7">
                <DialogHeader className="gap-1.5 sm:gap-2">
                    <DialogTitle className="text-lg sm:text-base">
                        {isEditing ? 'Edit Transaction' : 'Log Transaction'}
                    </DialogTitle>
                    {!isEditing && (
                        <DialogDescription className="text-base leading-snug sm:text-sm">
                            Add income or an expense to your budget.
                        </DialogDescription>
                    )}
                </DialogHeader>

                <form className="grid gap-4.5 sm:gap-4" onSubmit={handleSubmit}>
                    {!isEditing && <div className="grid gap-2">
                        <Label htmlFor="transactionTemplate">Template</Label>
                        <Select
                            items={transactionTemplateItems}
                            value={transactionTemplateId}
                            onValueChange={handleTransactionTemplateChange}
                            disabled={isFormDisabled}
                            id="transactionTemplate"
                        >
                            <SelectTrigger
                                id="transactionTemplate"
                                className="w-full text-base data-[size=default]:h-10 sm:text-sm sm:data-[size=default]:h-8"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Templates</SelectLabel>
                                    {transactionTemplateItems.map(item => (
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
                            className="h-10 sm:h-8"
                            id="transactionDescription"
                            type="text"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            disabled={isFormDisabled}
                            placeholder="e.g. Weekly groceries"
                            aria-required="true"
                            aria-invalid={isDescriptionInvalid}
                            aria-describedby={isDescriptionInvalid ? 'transaction-error' : undefined}
                        />
                    </div>

                    <div className="grid grid-cols-[minmax(0,4fr)_minmax(0,6fr)] gap-3 sm:grid-cols-2 sm:gap-4">
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
                                    className="h-10 pl-6 sm:h-8"
                                    id="transactionAmount"
                                    type="number"
                                    min="0.01"
                                    max="50000000"
                                    step="0.01"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    disabled={isFormDisabled}
                                    placeholder="0.00"
                                    aria-required="true"
                                    aria-invalid={isAmountInvalid}
                                    aria-describedby={isAmountInvalid ? 'transaction-error' : undefined}
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="transactionDate">Date</Label>
                            <InputGroup className="h-10 sm:h-8">
                                <InputGroupInput
                                    className="text-sm"
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
                                    aria-required="true"
                                    aria-invalid={isDateInvalid}
                                    aria-describedby={isDateInvalid ? 'transaction-error' : undefined}
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
                        <GroupedCategoryCombobox
                            className="h-10 w-full sm:h-8"
                            categories={categories}
                            value={categoryId}
                            onValueChange={selectedCategoryId => {
                                setCategoryId(selectedCategoryId)
                                setError('')
                            }}
                            disabled={isFormDisabled || categories.length === 0}
                            id="transactionCategory"
                            ariaRequired
                            ariaInvalid={isCategoryInvalid}
                            ariaDescribedBy={isCategoryInvalid ? 'transaction-error' : undefined}
                        />
                        {!isLoading && categories.length === 0 && (
                            <p className="text-xs text-muted-foreground">
                                Add a category in Settings first.
                            </p>
                        )}
                    </div>

                    {error && (
                        <p id="transaction-error" className="sr-only" role="alert">
                            {error}
                        </p>
                    )}

                    <DialogFooter
                        className={isEditing
                            ? "flex-row justify-between bg-popover sm:justify-end"
                            : "flex-row justify-end bg-popover"
                        }
                    >
                        {isEditing ? (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={() => {
                                    setIsDeleteDialogOpen(true)
                                }}
                                disabled={isSaving}
                                className="h-10 px-4 sm:h-8 sm:px-2.5"
                            >
                                Delete
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                                disabled={isSaving}
                                className="h-10 px-4 sm:h-8 sm:px-2.5"
                            >
                                Cancel
                            </Button>
                        )}
                        <Button
                            type="submit"
                            className="h-10 px-4 sm:h-8 sm:px-2.5"
                            disabled={isFormDisabled}
                        >
                            Save
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
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
                        <AlertDialogDescription>
                            “{transaction?.description}” will be permanently deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            disabled={isDeleting}
                            onClick={handleTransactionDelete}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

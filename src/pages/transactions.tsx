import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { ArrowUpDownIcon, CalendarIcon, Plus, SearchIcon } from "lucide-react"
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
import type { Transaction, Category, CategoryGroup } from "@/types"
import { SkeletonTable } from "@/components/skeleton-table"
import EmptyTable from "@/components/empty-table"
import { 
    InputGroup,
    InputGroupInput,
    InputGroupAddon
 } from "@/components/ui/input-group"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { type DateRange } from "react-day-picker"
import {
    endOfMonth,
    endOfWeek,
    format,
    startOfMonth,
    startOfWeek
} from "date-fns"

interface TransactionsProps {
    onLogTransaction : () => void
    revision : number
    onEditTransaction : (transaction : Transaction) => void
}

type DatePreset = 'today' | 'week' | 'month' | 'custom' | null
type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest'

const categoryGroups : CategoryGroup[] = ['income', 'needs', 'wants', 'savings']

const categoryGroupLabels : Record<CategoryGroup, string> = {
    income: 'Income',
    needs: 'Needs',
    wants: 'Wants',
    savings: 'Savings'
}

const sortOptionLabels : Record<SortOption, string> = {
    newest: 'Newest first',
    oldest: 'Oldest first',
    highest: 'Highest amount',
    lowest: 'Lowest amount'
}

const currencyFormatter = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD'
})

function formatMoney(amountCents : number) {
    return currencyFormatter.format(amountCents / 100)
}

function formatDate(date : string) {
    const [year, month, day] = date.split('-')

    return `${day}/${month}/${year}`
}


export default function Transactions({ onLogTransaction, revision, onEditTransaction } : TransactionsProps){

    const [error, setError] = useState('')
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [selectedCategoryId, setSelectedCategoryId] = useState('all')
    const [date, setDate] = useState<DateRange | undefined>(undefined)
    const [datePreset, setDatePreset] = useState<DatePreset>(null)
    const [isDateFilterOpen, setIsDateFilterOpen] = useState(false)
    const [sortOption, setSortOption] = useState<SortOption>('newest')


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


    const categoryMap = useMemo(() => {
        const map = new Map<string, Category>()

        for (const category of categories) {
            map.set(category.id, category)
        }

        return map
    }, [categories])

    const filteredTransactions = useMemo(() => {
        const fromDate = date?.from
            ? format(date.from, 'yyyy-MM-dd')
            : undefined
        const toDate = date?.from
            ? format(date.to ?? date.from, 'yyyy-MM-dd')
            : undefined

        const matchingTransactions = transactions.filter(transaction => {
            const matchesSearch = transaction.description
                .toLowerCase()
                .includes(search.trim().toLowerCase())
            const matchesCategory = selectedCategoryId === 'all'
                || transaction.categoryId === selectedCategoryId
            const matchesDate = !fromDate
                || !toDate
                || (transaction.date >= fromDate && transaction.date <= toDate)

            return matchesSearch && matchesCategory && matchesDate
        })

        return matchingTransactions.sort((firstTransaction, secondTransaction) => {
            if (sortOption === 'newest') {
                return secondTransaction.date.localeCompare(firstTransaction.date)
            }

            if (sortOption === 'oldest') {
                return firstTransaction.date.localeCompare(secondTransaction.date)
            }

            if (sortOption === 'highest') {
                return secondTransaction.amountCents - firstTransaction.amountCents
            }

            return firstTransaction.amountCents - secondTransaction.amountCents
        })
    }, [date, search, selectedCategoryId, sortOption, transactions])

    const categoryItems = [
        { label: 'All categories', value: 'all' },
        ...categories.map(category => ({
            label: category.name,
            value: category.id
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

    function handleDatePreset(preset : Exclude<DatePreset, 'custom' | null>) {
        const today = new Date()

        if (preset === 'today') {
            setDate({ from: today, to: today })
        }

        if (preset === 'week') {
            setDate({
                from: startOfWeek(today, { weekStartsOn: 1 }),
                to: endOfWeek(today, { weekStartsOn: 1 })
            })
        }

        if (preset === 'month') {
            setDate({
                from: startOfMonth(today),
                to: endOfMonth(today)
            })
        }

        setDatePreset(preset)
        setIsDateFilterOpen(false)
    }

    function clearDateFilter() {
        setDate(undefined)
        setDatePreset(null)
        setIsDateFilterOpen(false)
    }

    const dateFilterLabel = datePreset === 'today'
        ? 'Today'
        : datePreset === 'week'
            ? 'This week'
            : datePreset === 'month'
                ? 'This month'
                : date?.from
                    ? date.to
                        ? `${format(date.from, 'dd MMM yyyy')} - ${format(date.to, 'dd MMM yyyy')}`
                        : format(date.from, 'dd MMM yyyy')
                    : 'All dates'

    return (
    <main className='mx-auto grid w-full max-w-4xl gap-4 px-3 py-6 sm:gap-6 sm:px-4 sm:py-10'>
        <header className="flex items-start justify-between gap-3">
            <div className="space-y-1">
                <h1 className='font-heading text-2xl font-semibold tracking-tight sm:text-3xl'>Transactions</h1>
                <p className='text-sm text-muted-foreground'>Log and manage your income and spending here</p>
            </div>
            <div className="hidden shrink-0 sm:flex">
                <Button
                    variant="secondary"
                    className='h-8 self-center px-4'
                    onClick={onLogTransaction}
                >
                    <Plus className="size-4" /> Log
                </Button>
            </div>
        </header>
        <Card className="min-w-0 min-h-96 lg:min-h-144">
            <CardHeader className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 sm:flex sm:flex-row sm:gap-3">
                <InputGroup className="col-span-3 h-10 sm:h-8 sm:flex-1">
                    <InputGroupAddon><SearchIcon /></InputGroupAddon>
                    <InputGroupInput
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder='Search transactions...'
                        aria-label="Search transactions"
                    />
                </InputGroup>
                <Select
                    items={categoryItems}
                    value={selectedCategoryId}
                    onValueChange={value => setSelectedCategoryId(value ?? 'all')}
                >
                    <SelectTrigger
                        className="w-full data-[size=default]:h-10 sm:w-52 sm:data-[size=default]:h-8"
                        aria-label="Filter by category"
                    >
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false} className="max-h-64">
                        <SelectGroup>
                            <SelectLabel>Categories</SelectLabel>
                            <SelectItem value="all">All categories</SelectItem>
                        </SelectGroup>
                        {groupedCategories.map(group => (
                            <SelectGroup key={group.group}>
                                <SelectLabel>{group.label}</SelectLabel>
                                {group.items.map(category => (
                                    <SelectItem key={category.id} value={category.id}>
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        ))}
                    </SelectContent>
                </Select>
                <Popover open={isDateFilterOpen} onOpenChange={setIsDateFilterOpen}>
                    <PopoverTrigger 
                    render={
                        <Button 
                            variant="outline" 
                            id="date-picker-range" 
                            data-input-control
                            className="h-10 w-full min-w-0 justify-start rounded-lg pr-2.5 pl-3.5 font-normal sm:h-8 sm:w-auto"
                            aria-label="Filter by date"
                            title={dateFilterLabel}
                        >
                            <CalendarIcon className="shrink-0" data-icon="inline-start" />
                            <span className="truncate">{dateFilterLabel}</span>
                        </Button>} />
                    <PopoverContent className="w-auto max-w-[calc(100vw-1.5rem)] p-0" align="end">
                        <div className="grid grid-cols-2 gap-1 border-b p-2">
                            <Button
                                type="button"
                                variant={datePreset === 'today' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => handleDatePreset('today')}
                            >
                                Today
                            </Button>
                            <Button
                                type="button"
                                variant={datePreset === 'week' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => handleDatePreset('week')}
                            >
                                This week
                            </Button>
                            <Button
                                type="button"
                                variant={datePreset === 'month' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => handleDatePreset('month')}
                            >
                                This month
                            </Button>
                            <Button
                                type="button"
                                variant={datePreset === 'custom' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setDatePreset('custom')}
                            >
                                Custom
                            </Button>
                        </div>
                        <Calendar
                            mode="range"
                            selected={date}
                            className="[&_.rdp-month]:gap-2 [&_.rdp-week]:mt-1"
                            onSelect={range => {
                                setDate(range)
                                setDatePreset(range?.from ? 'custom' : null)
                            }}
                        />
                        {date?.from && (
                            <div className="border-t p-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="w-full"
                                    onClick={clearDateFilter}
                                >
                                    Clear filter
                                </Button>
                            </div>
                        )}
                    </PopoverContent>
                </Popover>
                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <Button
                                type="button"
                                variant="outline"
                                data-input-control
                                className="size-10 rounded-lg px-0 sm:size-8"
                                aria-label={`Sort transactions: ${sortOptionLabels[sortOption]}`}
                                title={`Sort: ${sortOptionLabels[sortOption]}`}
                            >
                                <ArrowUpDownIcon />
                            </Button>
                        }
                    />
                    <DropdownMenuContent className="w-44" align="end">
                        <DropdownMenuRadioGroup
                            value={sortOption}
                            onValueChange={value => setSortOption(value as SortOption)}
                        >
                            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                            {(Object.entries(sortOptionLabels) as [SortOption, string][]).map(
                                ([value, label]) => (
                                    <DropdownMenuRadioItem
                                        key={value}
                                        value={value}
                                        className="py-2 sm:py-1"
                                        closeOnClick
                                    >
                                        {label}
                                    </DropdownMenuRadioItem>
                                )
                            )}
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent className="min-w-0">
                {error ? (
                    <div className="flex min-h-52 items-center justify-center text-center">
                        <p className="text-sm text-destructive" role="alert">{error}</p>
                    </div>
                ) : isLoading ? <SkeletonTable /> :
                    transactions.length === 0 ? <EmptyTable onAdd={onLogTransaction}/> :
                    filteredTransactions.length === 0 ? (
                        <div className="flex min-h-52 items-center justify-center text-center">
                            <p className="text-sm text-muted-foreground">No matching transactions</p>
                        </div>
                    ) :
                <Table className="block table-fixed sm:table">
                    <colgroup className="hidden sm:table-column-group">
                        <col className="w-24 md:w-28" />
                        <col />
                        <col className="w-32 md:w-40" />
                        <col className="w-28 md:w-32" />
                    </colgroup>
                    <TableHeader className="hidden sm:table-header-group">
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="block sm:table-row-group">
                        {filteredTransactions.map((transaction) => {

                            const category = categoryMap.get(transaction.categoryId)
                            const categoryGroup = transaction.type === 'income'
                                ? 'income'
                                : category?.bucket

                            return (
                            <TableRow 
                                key={transaction.id} 
                                className="grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-0.5 px-2 py-2.5 first:border-t transition-colors hover:bg-muted/50 focus-within:bg-muted/50 focus-within:outline-none focus-within:ring-2 focus-within:ring-inset focus-within:ring-ring sm:table-row sm:px-0 sm:py-0 sm:first:border-t-0"
                                onClick={() => onEditTransaction(transaction)}
                            >
                                <TableCell className="col-start-2 row-start-2 block p-0 text-right text-[11px] font-normal text-muted-foreground sm:table-cell sm:p-2 sm:text-left sm:text-sm sm:font-medium sm:text-foreground">
                                    {formatDate(transaction.date)}
                                </TableCell>
                                <TableCell className="col-start-1 row-start-1 block min-w-0 p-0 font-medium sm:table-cell sm:p-2 sm:font-normal" title={transaction.description}>
                                    <p className="truncate">{transaction.description}</p>
                                    <button
                                        type="button"
                                        className="sr-only"
                                        onClick={event => {
                                            event.stopPropagation()
                                            onEditTransaction(transaction)
                                        }}
                                    >
                                        Edit {transaction.description} transaction
                                    </button>
                                </TableCell>
                                <TableCell className="col-start-1 row-start-2 block min-w-0 overflow-hidden p-0 sm:table-cell sm:p-2">
                                    <p className="truncate text-xs text-muted-foreground sm:text-sm sm:text-foreground">
                                        {category?.name}
                                        <span className="ml-1 capitalize sm:hidden">· {categoryGroup}</span>
                                    </p>
                                    <p className="hidden capitalize text-xs text-muted-foreground sm:block">{categoryGroup}</p>
                                </TableCell>
                                <TableCell className="col-start-2 row-start-1 block p-0 text-right font-medium tabular-nums sm:table-cell sm:p-2 sm:font-normal">
                                    {formatMoney(transaction.amountCents)}
                                </TableCell>
                            </TableRow>
                        )
                        })}
                    </TableBody>
                </Table>}

            </CardContent>
        </Card>
    </main>
    )
}

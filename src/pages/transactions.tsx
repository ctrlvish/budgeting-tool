import { useState, useEffect, useMemo } from "react"
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
import type { Transaction, Category, CategoryGroup } from "@/types"
import { SkeletonTable } from "@/components/skeleton-table"
import EmptyTable from "@/components/empty-table"
import { 
    InputGroup,
    InputGroupInput,
    InputGroupAddon
 } from "@/components/ui/input-group"
import { SearchIcon } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"

interface TransactionsProps {
    onLogTransaction : () => void
    revision : number
    onEditTransaction : (transaction : Transaction) => void
}

const categoryGroups : CategoryGroup[] = ['income', 'needs', 'wants', 'savings']

const categoryGroupLabels : Record<CategoryGroup, string> = {
    income: 'Income',
    needs: 'Needs',
    wants: 'Wants',
    savings: 'Savings'
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

    const filteredTransactions = transactions.filter(transaction => {
        const matchesSearch = transaction.description
            .toLowerCase()
            .includes(search.trim().toLowerCase())
        const matchesCategory = selectedCategoryId === 'all'
            || transaction.categoryId === selectedCategoryId

        return matchesSearch && matchesCategory
    })

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

    return (
    <main className='mx-auto grid w-full max-w-5xl gap-6 px-4 py-10'>
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
        <Card className="lg:min-h-144">
            <CardHeader className="flex flex-col gap-3 sm:flex-row">
                <InputGroup className="sm:flex-1">
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
                        className="w-full sm:w-52"
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
            </CardHeader>
            <CardContent>
                {error && <p>error: {error}</p>}
                {isLoading ? <SkeletonTable /> : 
                    transactions.length === 0 ? <EmptyTable onAdd={onLogTransaction}/> :
                                        <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTransactions.map((transaction) => {

                            const category = categoryMap.get(transaction.categoryId)
                            const categoryGroup = transaction.type === 'income'
                                ? 'income'
                                : category?.bucket

                            return (
                            <TableRow 
                                key={transaction.id} 
                                className="cursor-pointer transition-colors hover:bg-muted/50" 
                                tabIndex={0}
                                onClick={() => onEditTransaction(transaction)}>
                                <TableCell className="font-medium">{formatDate(transaction.date)}</TableCell>
                                <TableCell>{transaction.description}</TableCell>
                                <TableCell>
                                    <p>{category?.name}</p>
                                    <p className="capitalize text-xs text-muted-foreground">{categoryGroup}</p>
                                </TableCell>
                                <TableCell className="text-right">{formatMoney(transaction.amountCents)}</TableCell>
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

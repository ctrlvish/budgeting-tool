import { useEffect, useState } from "react"
import {db} from '../lib/db'
import type { Category } from "../types"
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
import { 
    Dialog, 
    DialogContent,
    DialogTitle
 } from "@/components/ui/dialog"

import type { CategoryGroup } from "../types"
import { 
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogCancel,
    AlertDialogAction,
    AlertDialogFooter
 } from "@/components/ui/alert-dialog"


const categoryChipStyles = `
    rounded-md bg-muted/50 px-2 py-1 text-xs text-muted-foreground
    hover:bg-muted hover:text-foreground hover:cursor-pointer
`

export default function Categories(){

    const [error, setError] = useState('')
    const [categories, setCategories] = useState<Category[]>([])
    const [name, setName] = useState('')
    const [categoryGroup, setCategoryGroup] = useState<CategoryGroup>('needs')
    const [isAdding, setIsAdding] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
    const [editName, setEditName] = useState('')
    const [editError, setEditError] = useState('')
    // to check if transactions or recurring transactions are referencing the category which is being edited
    const [usage, setUsage] = useState<{
        transactions: number
        recurringTransactions: number
    } | null>(null)
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState('')
    const categoryGroups : CategoryGroup[] = ['income', 'needs', 'wants', 'savings']
    
    const categoryGroupItems = categoryGroups.map(group => ({
        label: group.charAt(0).toUpperCase() + group.slice(1),
        value: group
    }))

    const needsCategories = categories.filter(category => category.bucket === 'needs')
    const wantsCategories = categories.filter(category => category.bucket === 'wants')
    const savingsCategories = categories.filter(category => category.bucket === 'savings')
    const incomeCategories = categories.filter(category => category.type === 'income')

    //for deleting category
    const isReferenced = usage !== null && (usage.transactions > 0 || usage.recurringTransactions > 0)

    async function handleCategoryAdd(e : React.SubmitEvent<HTMLFormElement>){
        e.preventDefault()

        const trimmedName = name.trim()

        const category : Category = {
            id: crypto.randomUUID(),
            name: trimmedName,
            type: categoryGroup === 'income' ? 'income' : 'expense',
            ...(categoryGroup !== 'income' ? { bucket: categoryGroup } : {})
        }

        if (!trimmedName) {
            setError('Please enter a name')
            return
        }

        setIsAdding(true)
        setError('')

        try {
            await db.categories.add(category)
            setCategories(previousCategories => [...previousCategories, category])
            setName('')
            setError('')
        } catch (error) {
            console.error('failed to create category', error)
            setError('Could not create category')
        } finally {
            setIsAdding(false)
        }

    }

    async function openEditCategory(category: Category) {
        setSelectedCategory(category)
        setEditName(category.name)
        setEditError('')
        setUsage(null)

        const [recurringTransactions, transactions] = await Promise.all([
            db.recurringTransactions.where('categoryId').equals(category.id).count(),
            db.transactions.where('categoryId').equals(category.id).count()
        ])

        setUsage({ recurringTransactions, transactions })
    }

    async function handleCategoryEdit(e : React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault()

        if (!selectedCategory) return

        const trimmedName = editName.trim()

        if (!trimmedName) {
            setEditError('Please enter a category name')
            return
        }

        setIsEditing(true)
        setEditError('')

        try {
            //edit category name here
            await db.categories.update(selectedCategory.id, {
                name: trimmedName
            })

            setCategories(previousCategories =>
            previousCategories.map(category =>
                category.id === selectedCategory.id
                    ? { ...category, name: trimmedName }
                    : category
            ))

            setSelectedCategory(null)
        }
        catch(error) {
            console.error('failed to rename category', error)
            setEditError('Could not rename category')
        }
        finally{
            setIsEditing(false)
        }
    }

    function openDeleteConfirmation() {
        if (!selectedCategory || usage === null || isReferenced) return
        setDeleteError('')
        setCategoryToDelete(selectedCategory)
    }

    async function handleCategoryDelete() {
        if (!categoryToDelete) return
        if (usage !== null && isReferenced) return


        setIsDeleting(true)
        setDeleteError('')

        try{
            //check references from db
            const [recurringTransactions, transactions] = await Promise.all([
                db.recurringTransactions
                    .where('categoryId')
                    .equals(categoryToDelete.id)
                    .count(),

                db.transactions
                    .where('categoryId')
                    .equals(categoryToDelete.id)
                    .count()
            ])
            
            if (recurringTransactions > 0 || transactions > 0) {
                setUsage({ recurringTransactions, transactions })
                setDeleteError('This category is now being used and cannot be deleted')
                return
            }

            //delete safely
            await db.categories.delete(categoryToDelete.id)

            setCategories(previous => 
                previous.filter(prev => 
                    prev.id !== categoryToDelete.id
                )
            )

            //close dialogs if successful
            setCategoryToDelete(null)
            setSelectedCategory(null)   
        }catch(error) {
            console.error('failed to delete category', error)
            setDeleteError('Could not delete category')
        }finally{
            setIsDeleting(false)
        }


    }


    useEffect(() => {
        db.categories.toArray()
            .then(category => setCategories(category))
            .catch(error => {
                console.error(error)
                setError('Could not load categories')
            })
                
    }, [])
    return (
        <Card className="w-full">
        <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>Configure income sources and expense categories.</CardDescription>
        </CardHeader>
        <CardContent>
            <form
                onSubmit={handleCategoryAdd}
                className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]"
            >
                <div className="grid gap-2">
                    <Label htmlFor="categoryName">Name</Label>
                    <Input
                        id="categoryName"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Groceries"
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="categoryGroup">Group</Label>
                    <Select
                        id="categoryGroup"
                        items={categoryGroupItems}
                        value={categoryGroup}
                        onValueChange={value => {
                            if (value) setCategoryGroup(value)
                        }}
                    >
                        <SelectTrigger id="categoryGroup" className="w-full">
                            <SelectValue />
                        </SelectTrigger>

                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Groups</SelectLabel>
                                {categoryGroupItems.map(item => (
                                    <SelectItem key={item.value} value={item.value}>
                                        {item.label}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>

                <Button
                    disabled={isAdding}
                    variant="quiet"
                    className="min-w-24 self-end justify-self-end px-4"
                    type="submit"
                >
                    {isAdding ? 'Adding...' : 'Add'}
                </Button>
            </form>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Income ({incomeCategories.length})
                </h3>
                <ul className="flex flex-wrap gap-1.5">
                    {incomeCategories.map(category => <li
                        key={category.id}><button
                            type="button"
                            onClick={() => openEditCategory(category)}
                            className={categoryChipStyles}>
                            {category.name}
                            </button></li>)}
                </ul>
            </div>
            <div>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Needs ({needsCategories.length})
                </h3>
                {/* {this ul map code repeats, maybe can refine later} */}
                <ul className="flex flex-wrap gap-1.5">
                    {needsCategories.map(category => <li 
                        key={category.id}><button
                            type="button"
                            onClick={() => openEditCategory(category)}
                            className={categoryChipStyles}>
                            {category.name}
                            </button></li>)}
                </ul>
            </div>
            <div>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Wants ({wantsCategories.length})
                </h3>
                <ul className="flex flex-wrap gap-1.5">
                    {wantsCategories.map(category => <li
                        key={category.id}><button
                            type="button"
                            onClick={() => openEditCategory(category)}
                            className={categoryChipStyles}>
                            {category.name}
                            </button></li>)}
                </ul>
            </div>
            <div>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Savings ({savingsCategories.length})
                </h3>
                <ul className="flex flex-wrap gap-1.5">
                    {savingsCategories.map(category => <li
                        key={category.id}><button
                            type="button"
                            onClick={() => openEditCategory(category)}
                            className={categoryChipStyles}>
                            {category.name}
                            </button></li>)}
                </ul>
            </div>
        </div>
        
        <Dialog
            open={selectedCategory !== null}
            onOpenChange={(open) => {
            if (!open) {
                setSelectedCategory(null)
                setEditError('')
            }
        }}>
            <DialogContent>
                <form className="grid gap-4" onSubmit={handleCategoryEdit}>
                    <DialogTitle> Edit {selectedCategory?.name}</DialogTitle>
                    <div className="grid gap-2">
                        <Label htmlFor="nameInput">Rename category</Label>
                        <Input
                            id="nameInput"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            ></Input>
                    </div>
                    {editError && (
                        <p className="text-sm text-destructive" role="alert">
                            {editError}
                        </p>
                    )}
                    {usage !== null && isReferenced && (
                        <p className="text-xs text-muted-foreground">
                            Used by {usage.transactions} transactions and{' '}
                            {usage.recurringTransactions} recurring transactions.
                            <br />
                            Reassign these items before deleting.
                        </p>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <Button type="submit"
                            variant="quiet"
                            disabled={isEditing}>{isEditing ? 'Saving...' : 'Save'}</Button>
                        <Button type="button" 
                            variant='destructive'
                            onClick={openDeleteConfirmation}
                            disabled={usage === null || isReferenced}>Delete</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
        <AlertDialog
            open={categoryToDelete !== null}
            onOpenChange={(open) => {
                if (!open) {
                    setCategoryToDelete(null)
                }
        }}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete category?</AlertDialogTitle>
                    <AlertDialogDescription>“{categoryToDelete?.name}” will be permanently deleted.</AlertDialogDescription>
                {deleteError && (
                    <p className="text-sm text-destructive font-medium">
                        {deleteError}
                    </p>
                )}
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>

                    <AlertDialogAction
                        disabled={isDeleting || isReferenced}
                        variant="destructive"
                        onClick={handleCategoryDelete}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        {error && <p className="mt-4 font-medium text-sm text-destructive" role="alert">{error}</p>}

        </CardContent>
        </Card>
    )
}

import { useState } from "react"
import { db } from '../lib/db'
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
import { toast } from "sonner"
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

import { useLiveQuery } from 'dexie-react-hooks'


const categoryChipStyles = `
    max-w-full truncate rounded-md bg-muted/50 px-2 py-1 text-xs text-muted-foreground
    hover:bg-muted hover:text-foreground hover:cursor-pointer
`

const emptyCategories : Category[] = []

export default function Categories(){

    const [error, setError] = useState('')
    const [name, setName] = useState('')
    const [categoryGroup, setCategoryGroup] = useState<CategoryGroup>('needs')
    const [isAdding, setIsAdding] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
    const [editName, setEditName] = useState('')
    const [editError, setEditError] = useState('')
    // to check if transactions or templates are referencing the category being edited
    const [usage, setUsage] = useState<{
        transactions: number
        transactionTemplates: number
    } | null>(null)
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const categoryGroups : CategoryGroup[] = ['income', 'needs', 'wants', 'savings']

    const categories = useLiveQuery(
        () => db.categories.toArray(),
        [],
        emptyCategories
    )
    
    const categoryGroupItems = categoryGroups.map(group => ({
        label: group.charAt(0).toUpperCase() + group.slice(1),
        value: group
    }))

    const needsCategories = categories.filter(category => category.bucket === 'needs')
    const wantsCategories = categories.filter(category => category.bucket === 'wants')
    const savingsCategories = categories.filter(category => category.bucket === 'savings')
    const incomeCategories = categories.filter(category => category.type === 'income')

    //for deleting category
    const isReferenced = usage !== null && (usage.transactions > 0 || usage.transactionTemplates > 0)
    const isAddNameInvalid = error === 'Please enter a name'
    const isEditNameInvalid = editError === 'Please enter a category name'

    function showAddError(message : string) {
        setError(message)
        toast.error(message)
    }

    function showEditError(message : string) {
        setEditError(message)
        toast.error(message)
    }

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
            showAddError('Please enter a name')
            return
        }

        setIsAdding(true)
        setError('')

        try {
            await db.categories.add(category)
            setName('')
            toast.success('Category added')
        } catch (error) {
            console.error('failed to create category', error)
            showAddError('Couldn’t add category')
        } finally {
            setIsAdding(false)
        }

    }

    async function openEditCategory(category: Category) {
        setSelectedCategory(category)
        setEditName(category.name)
        setEditError('')
        setUsage(null)

        const [transactionTemplates, transactions] = await Promise.all([
            db.transactionTemplates.where('categoryId').equals(category.id).count(),
            db.transactions.where('categoryId').equals(category.id).count()
        ])

        setUsage({ transactionTemplates, transactions })
    }

    async function handleCategoryEdit(e : React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault()

        if (!selectedCategory) return

        const trimmedName = editName.trim()

        if (!trimmedName) {
            showEditError('Please enter a category name')
            return
        }

        setIsEditing(true)
        setEditError('')

        try {
            //edit category name here
            await db.categories.update(selectedCategory.id, {
                name: trimmedName
            })

            setSelectedCategory(null)
            toast.success('Category renamed')
        }
        catch(error) {
            console.error('failed to rename category', error)
            showEditError('Couldn’t rename category')
        }
        finally{
            setIsEditing(false)
        }
    }

    function openDeleteConfirmation() {
        if (!selectedCategory || usage === null || isReferenced) return
        setCategoryToDelete(selectedCategory)
    }

    async function handleCategoryDelete() {
        if (!categoryToDelete) return
        if (usage !== null && isReferenced) return


        setIsDeleting(true)

        try{
            //check references from db
            const [transactionTemplates, transactions] = await Promise.all([
                db.transactionTemplates
                    .where('categoryId')
                    .equals(categoryToDelete.id)
                    .count(),

                db.transactions
                    .where('categoryId')
                    .equals(categoryToDelete.id)
                    .count()
            ])
            
            if (transactionTemplates > 0 || transactions > 0) {
                setUsage({ transactionTemplates, transactions })
                toast.error('This category is now being used and cannot be deleted')
                return
            }

            //delete safely
            await db.categories.delete(categoryToDelete.id)

            //close dialogs if successful
            setCategoryToDelete(null)
            setSelectedCategory(null)
            toast.success('Category deleted')
        }catch(error) {
            console.error('failed to delete category', error)
            toast.error('Couldn’t delete category')
        }finally{
            setIsDeleting(false)
        }


    }

    return (
        <Card className="w-full min-w-0">
        <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>Organise income and spending</CardDescription>
        </CardHeader>
        <CardContent className="min-w-0">
            <form
                onSubmit={handleCategoryAdd}
                className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 sm:grid-cols-[1fr_1fr_auto] sm:gap-4"
            >
                <div className="col-span-2 grid gap-2 sm:col-span-1">
                    <Label htmlFor="categoryName">Name</Label>
                    <Input
                        className="h-10 sm:h-8"
                        id="categoryName"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Groceries"
                        aria-required="true"
                        aria-invalid={isAddNameInvalid}
                        aria-describedby={isAddNameInvalid ? 'category-error' : undefined}
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
                        <SelectTrigger
                            id="categoryGroup"
                            className="w-full data-[size=default]:h-10 sm:data-[size=default]:h-8"
                            aria-required="true"
                        >
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
                    variant="outline"
                    className="h-10 min-w-20 self-end justify-self-end px-4 sm:h-8 sm:min-w-24"
                    type="submit"
                >
                    Add
                </Button>
            </form>

            {error && <p id="category-error" className="sr-only" role="alert">{error}</p>}

        <div className="mt-5 grid grid-cols-2 gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-4">
            <div className="min-w-0">
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
            <div className="min-w-0">
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
            <div className="min-w-0">
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
            <div className="min-w-0">
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
            <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-sm">
                <form className="grid gap-4" onSubmit={handleCategoryEdit}>
                    <DialogTitle className="text-lg sm:text-base">Edit {selectedCategory?.name}</DialogTitle>
                    <div className="grid gap-2">
                        <Label htmlFor="nameInput">Rename category</Label>
                        <Input
                            className="h-10 sm:h-8"
                            id="nameInput"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            aria-required="true"
                            aria-invalid={isEditNameInvalid}
                            aria-describedby={isEditNameInvalid ? 'category-edit-error' : undefined}
                            ></Input>
                    </div>
                    {editError && (
                        <p id="category-edit-error" className="sr-only" role="alert">
                            {editError}
                        </p>
                    )}
                    {usage !== null && isReferenced && (
                        <p className="text-xs text-muted-foreground">
                            Used by {usage.transactions} transactions and{' '}
                            {usage.transactionTemplates} transaction templates.
                            <br />
                            Reassign these items before deleting.
                        </p>
                    )}
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <Button
                            type="button"
                            className="h-10 px-4 sm:h-8 sm:px-2.5"
                            variant='destructive'
                            onClick={openDeleteConfirmation}
                            disabled={usage === null || isReferenced}>Delete</Button>
                        <Button
                            type="submit"
                            className="h-10 px-4 sm:h-8 sm:px-2.5"
                            variant="outline"
                            disabled={isEditing}>Save</Button>
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
            <AlertDialogContent className="data-[size=default]:max-w-[calc(100%-2rem)] sm:data-[size=default]:max-w-sm">
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete category?</AlertDialogTitle>
                    <AlertDialogDescription>“{categoryToDelete?.name}” will be permanently deleted.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-row justify-end">
                    <AlertDialogCancel className="h-10 px-4 sm:h-8 sm:px-2.5">Cancel</AlertDialogCancel>

                    <AlertDialogAction
                        disabled={isDeleting || isReferenced}
                        variant="destructive"
                        className="h-10 px-4 sm:h-8 sm:px-2.5"
                        onClick={handleCategoryDelete}
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        </CardContent>
        </Card>
    )
}

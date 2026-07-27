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

import type { Bucket } from "../types"
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
    const [bucket, setBucket] = useState<Bucket>('needs')
    const [isAdding, setIsAdding] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
    const [editName, setEditName] = useState('')
    const [editError, setEditError] = useState('')
    // to check if transactions or recurring expenses are referencing the category which is being edited
    const [usage, setUsage] = useState<{
        transactions: number
        recurringExpenses: number
    } | null>(null)
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState('')

    const buckets : Bucket[] = ['needs', 'wants', 'savings']
    
    const bucketItems = buckets.map(bucket => ({
        label: bucket.charAt(0).toUpperCase() + bucket.slice(1),
        value: bucket
    }))

    const needsCategories = categories.filter(category => category.bucket === 'needs')
    const wantsCategories = categories.filter(category => category.bucket === 'wants')
    const savingsCategories = categories.filter(category => category.bucket === 'savings')

    //for deleting category
    const isReferenced = usage !== null && (usage.transactions > 0 || usage.recurringExpenses > 0)

    async function handleCategoryAdd(e : React.SubmitEvent<HTMLFormElement>){
        e.preventDefault()

        const trimmedName = name.trim()

        const category : Category = {
            id: crypto.randomUUID(),
            name: trimmedName,
            bucket: bucket
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

        const [recurringExpenses, transactions] = await Promise.all([
            db.recurringExpenses.where('categoryId').equals(category.id).count(),
            db.transactions.where('categoryId').equals(category.id).count()
        ])

        setUsage({ recurringExpenses, transactions })
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
            const [recurringExpenses, transactions] = await Promise.all([
                db.recurringExpenses
                    .where('categoryId')
                    .equals(categoryToDelete.id)
                    .count(),

                db.transactions
                    .where('categoryId')
                    .equals(categoryToDelete.id)
                    .count()
            ])
            
            if (recurringExpenses > 0 || transactions > 0) {
                setUsage({ recurringExpenses, transactions })
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
            <CardDescription>Configure categories for each bucket.</CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleCategoryAdd} className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
                <Label htmlFor="categoryName">Name</Label>
                <Input
                    id="categoryName"
                    value={name}
                    onChange={e => setName(e.target.value)}>

                </Input>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="categoryBucket">Bucket</Label>
                <Select
                id="categoryBucket"
                items={bucketItems}
                value={bucket}
                onValueChange={value => {
                    if (value) setBucket(value)
                }}>
                    <SelectTrigger id="categoryBucket" className="w-full">
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
            <Button
                disabled={isAdding}
                className='self-end'
                type="submit">{isAdding ? 'Adding...' : 'Add'}</Button>
        </form>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
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
                            {usage.recurringExpenses} recurring expenses.
                            <br />
                            Reassign these items before deleting.
                        </p>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <Button type="submit"
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

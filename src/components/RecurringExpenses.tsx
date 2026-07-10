import { db } from '../lib/db'
import { useState, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import type { RecurringExpense, Bucket, Category } from '../types'

const buckets : Bucket[] = ['needs', 'wants', 'savings']

function formatMoney(amountCents : number) {
    return `$${(amountCents / 100).toFixed(2)}`
}

export default function RecurringExpenses(){
    const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([])
    const [bucket, setBucket] = useState<Bucket>('needs')
    const [categories, setCategories] = useState<Category[]>([])
    const [categoryId, setCategoryId] = useState('')
    const [name, setName] = useState('')
    const [amount, setAmount] = useState('')
    const [error, setError] = useState('')

    const filteredCategories = categories.filter(category => category.bucket === bucket)

    async function handleAdd(e : React.SubmitEvent<HTMLFormElement>){
        e.preventDefault()

        const trimmedName = name.trim()
        const amountNumber = Number(amount)
        const amountCents = Math.round(amountNumber * 100)

        if (!trimmedName) {
            setError('Please enter a name')
            return
        }

        if (!amount || !Number.isFinite(amountNumber) || amountNumber <= 0) {
            setError('Please enter an amount greater than 0')
            return
        }

        if (!categoryId) {
            setError('Please choose a category')
            return
        }

        const expense : RecurringExpense = {
            id: crypto.randomUUID(),
            name: trimmedName,
            amountCents,
            bucket,
            categoryId
        }

        try {
            await db.recurringExpenses.add(expense)
            setRecurringExpenses(previousExpenses => [...previousExpenses, expense])
            setName('')
            setAmount('')
            setCategoryId('')
            setError('')
        } catch (error) {
            console.error('failed to create recurring expense', error)
            setError('Could not create recurring expense')
        }
    }

    function handleBucketChange(e : React.ChangeEvent<HTMLSelectElement>) {
        setBucket(e.target.value as Bucket)
        setCategoryId('')
    }

    async function handleDelete(id : string) {
        try {
            await db.recurringExpenses.delete(id)
            setRecurringExpenses(previousExpenses => previousExpenses.filter(expense => expense.id !== id))
            setError('')
        } catch (error) {
            console.error('failed to delete recurring expense', error)
            setError('Could not delete recurring expense')
        }
    }

    useEffect(() => {
        db.recurringExpenses.toArray()
            .then(expenses => {
                setRecurringExpenses(expenses)
            })
            .catch(error => {
                console.error('failed to fetch recurring expenses', error)
                setError('Could not load recurring expenses')
            })
        db.categories.toArray()
            .then(categories => {
                setCategories(categories)
            })
            .catch(error => {
                console.error('failed to fetch categories', error)
                setError('Could not load categories')
            })

    }, [])
    
    return (
        <>
        <ul>
        {recurringExpenses.map((expense) => (
            <li key={expense.id}>
                {expense.name} - {formatMoney(expense.amountCents)}
                <button
                    type="button"
                    onClick={() => handleDelete(expense.id)}
                    aria-label={`Delete ${expense.name}`}
                >
                    <Trash2 size={16} />
                </button>
            </li>
        ))}
        </ul>
        <form onSubmit={handleAdd}>
            <label>Name</label>
            <input 
                type='text'
                value={name}
                onChange={e => setName(e.target.value)}
            ></input>
            <label>Amount</label>
            <input 
                type='number'
                value={amount}
                onChange={e => setAmount(e.target.value)}
            ></input>
            <label>Bucket</label>
            <select
                value={bucket}
                onChange={handleBucketChange}    
            >
                {buckets.map(bucket => <option key={bucket} value={bucket}>{bucket.charAt(0).toUpperCase() + bucket.slice(1)}</option>)}
            </select>
            <label>Category</label>
            <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
            >
                <option value="">Choose category</option>
                {filteredCategories.map(category => <option value={category.id} key={category.id}>{category.name}</option>)}
            </select>
            <button type="submit">Add</button>
        </form>
        {error && <p role="alert">{error}</p>}
        </>
    )
} 

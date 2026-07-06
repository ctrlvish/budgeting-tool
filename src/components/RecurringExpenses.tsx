import { db } from '../lib/db'
import { useState, useEffect } from 'react'
import type { RecurringExpense } from '../types'

export default function RecurringExpenses(){
    const [recurringExpense, setRecurringExpense] = useState<RecurringExpense[]>([])

    useEffect(() => {
        db.recurringExpenses.toArray()
            .then(expenses => {
                setRecurringExpense(expenses)
                console.log(expenses)
            })
            .catch(error => console.log('failed to fetch recurring expenses', error))
        db.categories.toArray().then(categories => console.log(categories))

    }, [])
    
    return (
        <ul>
        {recurringExpense.map((expense) => (
            <li key={expense.id}>{expense.name} - ${expense.amountCents / 100}</li>
        ))}
        </ul>
    )
} 

import { useEffect, useState } from "react"
import {db} from '../lib/db'
import type { Category } from "../types"



export default function Categories(){

    const [error, setError] = useState('')
    const [categories, setCategories] = useState<Category[]>([])
    const needsCategories = categories.filter(category => category.bucket === 'needs')
    const wantsCategories = categories.filter(category => category.bucket === 'wants')
    const savingsCategories = categories.filter(category => category.bucket === 'savings')

    useEffect(() => {
        db.categories.toArray()
            .then(category => setCategories(category))
            .catch(error => {
                console.error(error)
                setError('Could not load categories')
            })
                
    }, [])
    return (
        <>
        <h2>Categories</h2>
        <div className="category-container">
            <h3>Needs</h3>
            <ul>
                {needsCategories.map(needCat => <li key={needCat.id}>{needCat.name}</li>)}
            </ul>
            <h3>Wants</h3>
            <ul>
                {wantsCategories.map(wantCat => <li key={wantCat.id}>{wantCat.name}</li>)}
            </ul>
            <h3>Savings</h3>
            <ul>
                {savingsCategories.map(savingsCat => <li key={savingsCat.id}>{savingsCat.name}</li>)}
            </ul>
            {error && <p role="alert">{error}</p>}
        </div>
        </>
    )
}

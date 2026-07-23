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
import type { Bucket } from "../types"


export default function Categories(){

    const [error, setError] = useState('')
    const [categories, setCategories] = useState<Category[]>([])
    const [name, setName] = useState('')
    const [bucket, setBucket] = useState<Bucket>('needs')

    const buckets : Bucket[] = ['needs', 'wants', 'savings']
    
    const bucketItems = buckets.map(bucket => ({
        label: bucket.charAt(0).toUpperCase() + bucket.slice(1),
        value: bucket
    }))

    const needsCategories = categories.filter(category => category.bucket === 'needs')
    const wantsCategories = categories.filter(category => category.bucket === 'wants')
    const savingsCategories = categories.filter(category => category.bucket === 'savings')

    function handleCategoryAdd(){
        
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
        <div className="grid grid-cols-3">
            <div>
            <h3>Needs</h3>
            <ul>
                {needsCategories.map(needCat => <li key={needCat.id}>{needCat.name}</li>)}
            </ul>
            </div>
            <div>
            <h3>Wants</h3>
            <ul>
                {wantsCategories.map(wantCat => <li key={wantCat.id}>{wantCat.name}</li>)}
            </ul>
            </div>
            <div>
            <h3>Savings</h3>
            <ul>
                {savingsCategories.map(savingsCat => <li key={savingsCat.id}>{savingsCat.name}</li>)}
            </ul>
            </div>
            {error && <p role="alert">{error}</p>}
        </div>
        <form className="grid grid-cols-3">
            <div>
                <Label htmlFor="categoryName">Name</Label>
                <Input
                    id="categoryName"
                    value={name}
                    onChange={e => setName(e.target.value)}>

                </Input>
            </div>
            <div>
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
             onClick={handleCategoryAdd}>Add</Button>
        </form>
        </CardContent>
        </Card>
    )
}

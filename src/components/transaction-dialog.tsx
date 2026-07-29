import { useEffect, useState } from "react";
import { 
    Dialog,
    DialogHeader,
    DialogTitle,
    DialogContent,
    DialogFooter,
    DialogDescription
 } from "./ui/dialog";

import { Button } from "./ui/button";
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue

 } from "@/components/ui/select"
import type { Category } from "@/types";
import { db } from "@/lib/db";

export default function TransactionDialog(){
    const [error, setError] = useState('')
    const [categories, setCategories] = useState<Category[]>([])

    useEffect(() => {
            db.categories.toArray()
                .then(category => setCategories(category))
                .catch(error => {
                    console.error(error)
                    setError('Could not load categories')
                })
                    
        }, [])

    return (
        <form>
            {error && <p>error: {error}</p>}
            <Dialog>
                <DialogHeader>
                    <DialogTitle>Log</DialogTitle>
                    <DialogDescription>Add income or spending to your budget</DialogDescription>
                    <DialogContent>
                        <Label htmlFor="description"></Label>
                        <Input id="description"></Input>
                        <Label htmlFor="amount"></Label>
                        <Input id="amount"></Input>
                        <Label htmlFor="date"></Label>
                        <Input id="date"></Input>
                        <Label htmlFor="category"></Label>
                        <Select
                            items={bucketItems}
                            value={bucket}
                            onValueChange={handleBucketChange}
                            disabled={isFormDisabled}
                        >
                            <SelectTrigger id="recurringExpenseBucket" className="w-full">
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
                    </DialogContent>
                    <DialogFooter>
                        <Button></Button>
                        <Button></Button>
                    </DialogFooter>
                </DialogHeader>
            </Dialog>
        </form>
    )
}
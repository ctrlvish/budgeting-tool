import { Button } from "./ui/button"
import {Sun} from 'lucide-react'

export default function AppHeader(){
    return (
        <header className="grid max-w-4xl mx-auto grid-cols-[1fr_auto_1fr] border-b py-2 px-5">
            <div className="">
                <p>budgeting tool</p>
            </div>
            <nav className="flex gap-3">
                <Button variant='ghost'>home</Button>
                <Button variant='ghost'>transactions</Button>
                <Button variant='secondary'>settings</Button>
            </nav>
            <div className="flex gap-2 justify-self-end">
                <Button type='button' variant='ghost' aria-label="Toggle Theme"><Sun /></Button>
                <Button type='button' aria-label="Add Transaction">+</Button>
            </div>
        </header>
    )
}

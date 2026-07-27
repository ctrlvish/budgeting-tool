import { Button } from "./ui/button"
import {Sun} from 'lucide-react'
import { NavLink } from "react-router"
import { ModeToggle } from "./mode-toggle"

export default function AppHeader(){
    return (
        <header className="grid max-w-4xl mx-auto grid-cols-[1fr_auto_1fr] border-b py-2 px-5">
            <div className="">
                <p>budgeting tool</p>
            </div>
            <nav className="flex gap-3">
                <NavLink to='/'>
                    home
                </NavLink>
                <NavLink to='/transactions'>
                    transactions
                </NavLink>
                <NavLink to='/settings'>
                    settings
                </NavLink>
            </nav>
            <div className="flex gap-2 justify-self-end">
                <ModeToggle></ModeToggle>
                <Button type='button' aria-label="Add Transaction">+</Button>
            </div>
        </header>
    )
}

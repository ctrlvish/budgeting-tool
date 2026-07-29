import { Button } from "./ui/button"
import { NavLink } from "react-router"
import { Plus } from "lucide-react"
import { ModeToggle } from "./mode-toggle"

const navigationLinkStyles = `
    px-2.5 py-1.5 font-heading text-xs text-foreground
    transition-colors duration-150 hover:text-muted-foreground
    sm:px-3 sm:text-sm
`

interface AppHeaderProps {
    onLogTransaction : () => void
}

export default function AppHeader({ onLogTransaction } : AppHeaderProps){
    return (
        <header className="sticky top-0 z-50 w-full bg-background/90 backdrop-blur-md">
            <div className="mx-auto grid h-14 w-full max-w-4xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center px-4">
                <div className="hidden h-full items-center sm:grid">
                    <NavLink to='/' className='font-heading'>
                        budgeting tool
                    </NavLink>
                </div>
                <nav className="flex items-center gap-1" aria-label="Primary navigation">
                    <NavLink to='/' className={navigationLinkStyles} end>
                        dashboard
                    </NavLink>
                    <NavLink to='/transactions' className={navigationLinkStyles}>
                        transactions
                    </NavLink>
                    <NavLink to='/settings' className={navigationLinkStyles}>
                        settings
                    </NavLink>
                </nav>
                <div className="flex items-center gap-1 justify-self-end">
                    <ModeToggle />
                    <Button
                        type='button'
                        size="icon"
                        onClick={onLogTransaction}
                        aria-label="Add transaction"
                    >
                        <Plus className="size-4" />
                    </Button>
                </div>
            </div>
        </header>
    )
}

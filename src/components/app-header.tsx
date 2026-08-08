import { Button } from "./ui/button"
import { NavLink } from "react-router"
import { House, List, Plus, Settings } from "lucide-react"
import { ModeToggle } from "./mode-toggle"

const navigationLinkStyles = `
    rounded-sm px-3 py-1.5 font-heading text-sm font-medium text-foreground
    transition-colors duration-150 hover:text-muted-foreground
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
    dark:font-normal
`

function mobileNavigationLinkStyles({isActive} : {isActive : boolean}) {
    return `
        flex min-h-14 items-center justify-center px-2
        transition-colors duration-150 hover:text-muted-foreground
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset
        focus-visible:ring-ring
        ${isActive ? 'text-foreground' : 'text-muted-foreground'}
    `
}

interface AppHeaderProps {
    onLogTransaction : () => void
}

export default function AppHeader({ onLogTransaction } : AppHeaderProps) {
    return (
        <>
            <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
                <div className="mx-auto grid h-14 w-full max-w-4xl grid-cols-[minmax(0,1fr)_auto] items-center px-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
                    <div className="flex h-full items-center">
                        <NavLink
                            to='/'
                            className="font-heading text-sm font-medium text-foreground transition-colors duration-150 hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:font-normal sm:text-base"
                        >
                            budgeting tool
                        </NavLink>
                    </div>
                    <nav className="hidden items-center gap-2 sm:flex" aria-label="Primary navigation">
                        <NavLink to='/' className={navigationLinkStyles} end>
                            dashboard
                        </NavLink>
                        <NavLink to='/transactions' className={navigationLinkStyles}>
                            transactions
                        </NavLink>
                    </nav>
                    <div className="flex items-center gap-1 justify-self-end">
                        <ModeToggle />
                        <NavLink
                            to="/settings"
                            className="flex size-10 items-center justify-center rounded-full bg-transparent text-foreground transition-opacity duration-150 hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:size-8"
                            aria-label="Settings"
                        >
                            <Settings className="size-5" />
                            <span className="sr-only">Settings</span>
                        </NavLink>
                    </div>
                </div>
            </header>

            <nav
                className="fixed inset-x-0 bottom-0 z-40 border-t border-border/50 bg-background/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:hidden"
                aria-label="Mobile navigation"
            >
                <div className="mx-auto grid h-16 max-w-md grid-cols-3 px-2">
                    <NavLink to='/' className={mobileNavigationLinkStyles} end>
                        <House className="size-6" />
                        <span className="sr-only">Dashboard</span>
                    </NavLink>
                    <Button
                        type="button"
                        variant="ghost"
                        className="h-full w-full rounded-none bg-transparent text-foreground hover:bg-transparent hover:text-muted-foreground"
                        onClick={onLogTransaction}
                        aria-label="Log transaction"
                    >
                        <Plus className="size-6" />
                    </Button>
                    <NavLink to='/transactions' className={mobileNavigationLinkStyles}>
                        <List className="size-6" />
                        <span className="sr-only">Transactions</span>
                    </NavLink>
                </div>
            </nav>
        </>
    )
}

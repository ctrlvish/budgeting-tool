import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog'

function SetupPreview() {
    return (
        <div
            className="grid gap-2 rounded-lg border bg-background px-3.5 py-2.5"
            aria-hidden="true"
        >
            <div className="grid gap-1.5">
                <span className="text-xs font-medium">Starting savings balance</span>
                <div className="flex h-7 items-center rounded-full border bg-background px-3 text-sm">
                    <span className="mr-1 text-muted-foreground">$</span>
                    2,500.00
                </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-full bg-muted px-2 py-1">Needs 50%</div>
                <div className="rounded-full bg-muted px-2 py-1">Wants 30%</div>
                <div className="rounded-full bg-muted px-2 py-1">Savings 20%</div>
            </div>
        </div>
    )
}

function LogPreview() {
    return (
        <div
            className="grid gap-2 rounded-lg border bg-background px-3.5 py-2.5"
            aria-hidden="true"
        >
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b pb-2">
                <div>
                    <p className="font-medium">Salary</p>
                    <p className="text-xs text-muted-foreground">Income</p>
                </div>
                <p className="font-medium">+$3,200.00</p>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <div>
                    <p className="font-medium">Weekly groceries</p>
                    <p className="text-xs text-muted-foreground">Groceries · Needs</p>
                </div>
                <p className="font-medium">$84.50</p>
            </div>
        </div>
    )
}

function DashboardPreview() {
    const rows = [
        { label: 'Groceries', width: '82%', color: 'bg-[var(--bucket-needs)]' },
        { label: 'Eating out', width: '68%', color: 'bg-[var(--bucket-wants)]' },
        { label: 'Stocks', width: '74%', color: 'bg-[var(--bucket-savings)]' }
    ]

    return (
        <div
            className="grid gap-2.5 rounded-lg border bg-background px-3.5 py-2.5"
            aria-hidden="true"
        >
            {rows.map(row => (
                <div className="grid gap-1.5" key={row.label}>
                    <div className="flex justify-between text-xs">
                        <span className="font-medium">{row.label}</span>
                        <span className="text-muted-foreground">{row.width}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                            className={`h-full rounded-full ${row.color}`}
                            style={{width: row.width}}
                        />
                    </div>
                </div>
            ))}
        </div>
    )
}

interface HowToDialogProps {
    open : boolean
    onOpenChange : (open : boolean) => void
}

export default function HowToDialog({
    open,
    onOpenChange
} : HowToDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[calc(100dvh-1.5rem)] max-w-[calc(100%-3rem)] gap-5 overflow-y-auto **:data-[slot=dialog-close]:size-9 sm:max-h-[calc(100dvh-2rem)] sm:max-w-lg sm:gap-4 sm:**:data-[slot=dialog-close]:size-7">
                <DialogHeader className="gap-1.5 pr-7">
                    <DialogTitle className="text-lg">How to use budgeting tool</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4">
                    <section className="grid gap-1.5">
                        <div>
                            <h2 className="font-heading font-medium">1. Settings — set things up</h2>
                            <p className="text-xs text-muted-foreground">
                                Add the cash you have. Pick targets, categories, and templates.
                            </p>
                        </div>
                        <SetupPreview />
                    </section>

                    <section className="grid gap-1.5">
                        <div>
                            <h2 className="font-heading font-medium">2. Transactions — log money</h2>
                            <p className="text-xs text-muted-foreground">
                                Income adds money. Needs, wants, and savings use it.
                            </p>
                        </div>
                        <LogPreview />
                    </section>

                    <section className="grid gap-1.5">
                        <div>
                            <h2 className="font-heading font-medium">3. Dashboard — see the result</h2>
                            <p className="text-xs text-muted-foreground">
                                Your dashboard updates from what you log. Money left over counts as savings.
                            </p>
                        </div>
                        <DashboardPreview />
                    </section>
                </div>
            </DialogContent>
        </Dialog>
    )
}

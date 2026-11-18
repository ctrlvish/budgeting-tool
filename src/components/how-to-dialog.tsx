import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog'

interface HowToDialogProps {
    open : boolean
    onOpenChange : (open : boolean) => void
}

function isRunningStandalone() {
    const navigatorWithStandalone = navigator as Navigator & {
        standalone? : boolean
    }

    return window.matchMedia('(display-mode: standalone)').matches
        || navigatorWithStandalone.standalone === true
}

export default function HowToDialog({
    open,
    onOpenChange
} : HowToDialogProps) {
    const showInstallGuide = !isRunningStandalone()

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="how-to-dialog max-h-[calc(100dvh-1.5rem)] max-w-[calc(100%-3rem)] gap-6 overflow-y-auto p-5 **:data-[slot=dialog-close]:size-9 sm:max-h-[calc(100dvh-3rem)] sm:max-w-[min(52rem,calc(100%-4rem))] sm:gap-8 sm:p-10 md:p-12 sm:**:data-[slot=dialog-close]:size-8">
                <DialogHeader className="pr-8">
                    <DialogTitle className="text-lg sm:text-2xl sm:tracking-tight">How budgeting tool works</DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 md:grid-cols-3 md:gap-x-8 md:gap-y-9">
                    {showInstallGuide && (
                        <section className="grid gap-2 border-b pb-6 md:col-span-3 md:grid-cols-[1fr_1.35fr] md:gap-x-10 md:pb-8">
                            <h2 className="font-heading font-medium">Install on your phone</h2>
                            <p className="leading-relaxed text-muted-foreground md:col-start-1">
                                On your phone, add budgeting tool to your Home Screen to open it like an app. On a computer, you can use it in your browser.
                            </p>
                            <div className="grid content-start gap-1.5 text-xs leading-relaxed text-muted-foreground md:gap-3 md:col-start-2 md:row-span-2 md:row-start-1">
                                <p className="flex items-start gap-2">
                                    <span className="w-14 shrink-0 font-medium text-foreground">
                                        iPhone
                                    </span>
                                    <span>
                                        Open Share in Safari, then choose Add to Home Screen.
                                    </span>
                                </p>
                                <p className="flex items-start gap-2">
                                    <span className="w-14 shrink-0 font-medium text-foreground">
                                        Android
                                    </span>
                                    <span>
                                        Open the browser menu, then choose Install app or Add to Home screen.
                                    </span>
                                </p>
                            </div>
                        </section>
                    )}

                    <section className="grid content-start gap-1.5 md:gap-3">
                        <h2 className="font-heading font-medium">Settings</h2>
                        <p className="leading-relaxed text-muted-foreground">
                            Add the savings you already have, choose your targets, and edit your categories. Templates are optional.
                        </p>
                    </section>

                    <section className="grid content-start gap-1.5 md:gap-3">
                        <h2 className="font-heading font-medium">Transactions</h2>
                        <p className="leading-relaxed text-muted-foreground">
                            Log money whenever it comes in or goes out. Pick a category so the app knows where it belongs.
                        </p>
                    </section>

                    <section className="grid content-start gap-1.5 md:gap-3">
                        <h2 className="font-heading font-medium">Dashboard</h2>
                        <p className="leading-relaxed text-muted-foreground">
                            See what’s left to spend after your savings plan, track transfers and unspent money separately from cash shortfalls, and compare category spending month by month.
                        </p>
                    </section>

                    <p className="pt-1 text-center text-[11px] leading-relaxed text-muted-foreground/70 md:col-span-3">
                        Thank you for trying it out <span aria-hidden="true">♥</span>
                        <br />
                        Track your ratios, spend without guilt 
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}

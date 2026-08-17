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
            <DialogContent className="max-h-[calc(100dvh-1.5rem)] max-w-[calc(100%-3rem)] gap-6 overflow-y-auto p-5 **:data-[slot=dialog-close]:size-9 sm:max-h-[calc(100dvh-2rem)] sm:max-w-md sm:p-6 sm:**:data-[slot=dialog-close]:size-7">
                <DialogHeader className="pr-8">
                    <DialogTitle className="text-lg">How budgeting tool works</DialogTitle>
                </DialogHeader>

                <div className="grid gap-6">
                    {showInstallGuide && (
                        <section className="grid gap-2 border-b pb-6">
                            <h2 className="font-heading font-medium">Use it like an app</h2>
                            <p className="leading-relaxed text-muted-foreground">
                                For the best experience, add budgeting tool to your Home Screen.
                            </p>
                            <div className="grid gap-1.5 text-xs leading-relaxed text-muted-foreground">
                                <p className="flex items-start gap-2">
                                    <span className="w-14 shrink-0 font-medium text-foreground">
                                        Apple
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

                    <section className="grid gap-1.5">
                        <h2 className="font-heading font-medium">Settings</h2>
                        <p className="leading-relaxed text-muted-foreground">
                            Add the savings you already have, choose your targets, and edit your categories. Templates are optional.
                        </p>
                    </section>

                    <section className="grid gap-1.5">
                        <h2 className="font-heading font-medium">Transactions</h2>
                        <p className="leading-relaxed text-muted-foreground">
                            Log money whenever it comes in or goes out. Pick a category so the app knows where it belongs.
                        </p>
                    </section>

                    <section className="grid gap-1.5">
                        <h2 className="font-heading font-medium">Dashboard</h2>
                        <p className="leading-relaxed text-muted-foreground">
                            See where your money went each month and year. Anything left after spending counts as savings.
                        </p>
                    </section>

                    <p className="pt-1 text-center text-[11px] leading-relaxed text-muted-foreground/70">
                        Thank you for trying it out <span aria-hidden="true">♥</span>
                        <br />
                        Track your ratios, spend without guilt 
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}

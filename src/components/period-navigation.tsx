import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PeriodNavigationProps {
    disableNext : boolean
    nextLabel : string
    previousLabel : string
    onNext : () => void
    onPrevious : () => void
    onReset : () => void
    resetLabel : string
    showReset : boolean
}

export default function PeriodNavigation({
    disableNext,
    nextLabel,
    previousLabel,
    onNext,
    onPrevious,
    onReset,
    resetLabel,
    showReset
} : PeriodNavigationProps) {
    return (
        <div className="flex items-center gap-0.5 sm:gap-1">
            {showReset && (
                <button
                    type="button"
                    className="mr-0.5 min-h-9 cursor-pointer !bg-transparent px-1 text-xs underline underline-offset-4 transition-colors hover:!bg-transparent hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:mr-1 sm:min-h-7"
                    aria-label={resetLabel}
                    onClick={onReset}
                >
                    Back to current
                </button>
            )}
            <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-9 !bg-transparent hover:!bg-transparent hover:text-muted-foreground sm:size-7 dark:!bg-transparent dark:hover:!bg-transparent"
                aria-label={previousLabel}
                onClick={onPrevious}
            >
                <ChevronLeftIcon />
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-9 !bg-transparent hover:!bg-transparent hover:text-muted-foreground sm:size-7 dark:!bg-transparent dark:hover:!bg-transparent"
                aria-label={nextLabel}
                disabled={disableNext}
                onClick={onNext}
            >
                <ChevronRightIcon />
            </Button>
        </div>
    )
}

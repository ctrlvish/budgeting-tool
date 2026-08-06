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
        <div className="flex items-center gap-1">
            {showReset && (
                <button
                    type="button"
                    className="mr-1 cursor-pointer text-xs underline underline-offset-4 transition-colors hover:text-muted-foreground"
                    aria-label={resetLabel}
                    onClick={onReset}
                >
                    Reset
                </button>
            )}
            <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={previousLabel}
                onClick={onPrevious}
            >
                <ChevronLeftIcon />
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={nextLabel}
                disabled={disableNext}
                onClick={onNext}
            >
                <ChevronRightIcon />
            </Button>
        </div>
    )
}

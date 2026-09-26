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
            <Button
                type="button"
                variant="plain"
                size="icon-sm"
                className="size-9 sm:size-7"
                aria-label={previousLabel}
                onClick={onPrevious}
            >
                <ChevronLeftIcon />
            </Button>
            <Button
                type="button"
                variant="plain"
                size="sm"
                className="h-9 w-16 shrink-0 text-xs sm:h-7"
                aria-label={resetLabel}
                title={resetLabel}
                disabled={!showReset}
                onClick={onReset}
            >
                Current
            </Button>
            <Button
                type="button"
                variant="plain"
                size="icon-sm"
                className="size-9 sm:size-7"
                aria-label={nextLabel}
                disabled={disableNext}
                onClick={onNext}
            >
                <ChevronRightIcon />
            </Button>
        </div>
    )
}

import type { Bucket } from "@/types"
import { cn } from "@/lib/utils"

const currencyFormatter = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD'
})

const bucketBarClasses : Record<Bucket, string> = {
    needs: 'bg-[var(--bucket-needs)]',
    wants: 'bg-[var(--bucket-wants)]',
    savings: 'bg-[var(--bucket-savings)]'
}

interface CategoryRow {
    id : string
    name : string
    bucket : Bucket
    amountCents : number
    percentage : number | null
}

interface BucketSection {
    id : string
    label : string
    percentage : number | null
    rows : CategoryRow[]
}

interface CategoryBreakdownProps {
    expanded? : boolean
    hasIncome : boolean
    sections : BucketSection[]
}

function formatMoney(amountCents : number) {
    return currencyFormatter.format(amountCents / 100)
}

function formatPercentage(percentage : number | null) {
    return percentage === null
        ? '—'
        : percentage > 0 && percentage < 1
            ? '<1%'
            : `${Math.round(percentage)}%`
}

export default function CategoryBreakdown({
    expanded = false,
    hasIncome,
    sections
} : CategoryBreakdownProps) {
    if (!hasIncome && sections.length > 0) {
        return (
            <div className={cn(
                "flex items-center justify-center text-center",
                expanded ? "h-full min-h-56" : "h-56 sm:h-64"
            )}>
                <p className="text-xs text-muted-foreground">
                    Add income to view this month's overview
                </p>
            </div>
        )
    }

    if (sections.length === 0) {
        return (
            <div className={cn(
                "flex items-center justify-center text-center",
                expanded ? "h-full min-h-56" : "h-56 sm:h-64"
            )}>
                <p className="text-xs text-muted-foreground">
                    No activity this month
                </p>
            </div>
        )
    }

    return (
        <div className={cn(
            "no-scrollbar grid content-start gap-3 overflow-y-auto overscroll-contain pr-1 sm:gap-4 sm:pr-2",
            expanded ? "h-full min-h-0" : "h-56 sm:h-64"
        )}>
            {sections.map(section => (
                <section key={section.id} className="grid gap-2.5">
                    <h3 className="text-sm font-medium">
                        {section.label}
                        <span className="ml-1 text-muted-foreground">
                            ({formatPercentage(section.percentage)})
                        </span>
                    </h3>
                    <div className="grid gap-2.5">
                        {section.rows.map(row => {
                            const barWidth = row.percentage === null
                                ? 0
                                : Math.min(Math.abs(row.percentage), 100)

                            return (
                                <div key={row.id} className="grid gap-1">
                                    <p className="flex items-baseline gap-1.5 text-sm">
                                        {row.name}
                                        <span className="text-xs tabular-nums text-muted-foreground">
                                            {formatMoney(row.amountCents)}
                                        </span>
                                        <span className="text-xs tabular-nums text-muted-foreground">
                                            {formatPercentage(row.percentage)}
                                        </span>
                                    </p>
                                    <div className="h-4 overflow-hidden rounded-full bg-muted/70 sm:h-3.5">
                                        <div
                                            className={`h-full rounded-full transition-[width] duration-200 ease-out motion-reduce:transition-none ${bucketBarClasses[row.bucket]}`}
                                            style={{ width: `${barWidth}%` }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </section>
            ))}
        </div>
    )
}

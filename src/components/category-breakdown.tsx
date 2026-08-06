import { useState } from "react"
import type { Bucket } from "@/types"
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover"

const currencyFormatter = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD'
})

const bucketBarClasses : Record<Bucket, string> = {
    needs: 'bg-sky-500/65 dark:bg-sky-400/65',
    wants: 'bg-amber-700/55 dark:bg-amber-400/55',
    savings: 'bg-emerald-700/55 dark:bg-emerald-400/55'
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
    hasIncome : boolean
    sections : BucketSection[]
}

interface AmountBarProps {
    amountCents : number
    barClass : string
    name : string
    width : number
}

function formatMoney(amountCents : number) {
    return currencyFormatter.format(amountCents / 100)
}

export function formatPercentage(percentage : number | null) {
    return percentage === null
        ? '—'
        : percentage > 0 && percentage < 1
            ? '<1%'
            : `${Math.round(percentage)}%`
}

function AmountBar({amountCents, barClass, name, width} : AmountBarProps) {
    const [cursorPosition, setCursorPosition] = useState<{x : number, y : number} | null>(null)
    const cursorAnchor = cursorPosition
        ? {
            getBoundingClientRect: () => new DOMRect(
                cursorPosition.x,
                cursorPosition.y,
                0,
                0
            )
        }
        : undefined

    return (
        <Popover>
            <PopoverTrigger
                openOnHover
                delay={150}
                render={
                    <button
                        type="button"
                        className="h-3.5 w-full cursor-default overflow-hidden rounded-full bg-muted/70 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                        aria-label={`${name}: ${formatMoney(amountCents)}`}
                        onPointerMove={event => {
                            if (event.pointerType === 'mouse') {
                                setCursorPosition({
                                    x: event.clientX,
                                    y: event.clientY
                                })
                            }
                        }}
                        onPointerDown={event => {
                            if (event.pointerType !== 'mouse') {
                                setCursorPosition(null)
                            }
                        }}
                        onFocus={() => setCursorPosition(null)}
                    >
                        <span
                            className={`block h-full rounded-full transition-[width] duration-200 ease-out motion-reduce:transition-none ${barClass}`}
                            style={{ width: `${width}%` }}
                        />
                    </button>
                }
            />
            <PopoverContent
                anchor={cursorAnchor}
                positionMethod={cursorAnchor ? 'fixed' : 'absolute'}
                side="top"
                className="w-auto px-3 py-1.5 text-xs"
            >
                {formatMoney(amountCents)}
            </PopoverContent>
        </Popover>
    )
}

export default function CategoryBreakdown({hasIncome, sections} : CategoryBreakdownProps) {
    if (!hasIncome && sections.length > 0) {
        return (
            <p className="text-xs text-muted-foreground">
                Add income to view this month's overview
            </p>
        )
    }

    if (sections.length === 0) {
        return (
            <p className="text-xs text-muted-foreground">
                No activity this month
            </p>
        )
    }

    return (
        <div className="grid max-h-64 gap-4 overflow-y-auto pr-2">
            {sections.map(section => (
                <section key={section.id} className="grid gap-2.5">
                    <h3 className="sticky top-0 z-10 bg-card py-1 text-sm font-medium">
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
                                    <p className="text-sm">
                                        {row.name}
                                        <span className="ml-1 text-xs tabular-nums text-muted-foreground">
                                            {formatPercentage(row.percentage)}
                                        </span>
                                    </p>
                                    <AmountBar
                                        amountCents={row.amountCents}
                                        barClass={bucketBarClasses[row.bucket]}
                                        name={row.name}
                                        width={barWidth}
                                    />
                                </div>
                            )
                        })}
                    </div>
                </section>
            ))}
        </div>
    )
}

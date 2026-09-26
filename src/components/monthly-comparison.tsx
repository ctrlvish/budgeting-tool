import { Fragment, useLayoutEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { dashboardGroups, type getDashboardYear } from '@/lib/dashboard-summary'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table'
import PeriodNavigation from '@/components/period-navigation'

interface MonthlyComparisonProps {
    data : ReturnType<typeof getDashboardYear>
    year : number
    onYearChange : (year : number) => void
}

const money = (cents : number) => new Intl.NumberFormat('en-AU', {
    style: 'currency', currency: 'AUD'
}).format(cents / 100)

export default function MonthlyComparison({ data, year, onYearChange } : MonthlyComparisonProps) {
    const [collapsedBuckets, setCollapsedBuckets] = useState<Set<string>>(() => new Set(dashboardGroups.map(group => group.id)))

    function toggleBucket(id : string) {
        setCollapsedBuckets(previous => {
            const next = new Set(previous)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const contentRef = useRef<HTMLDivElement>(null)
    const [recapHeight, setRecapHeight] = useState(240)
    const hasActivity = data.months.some(month => month.hasActivity)

    useLayoutEffect(() => {
        const content = contentRef.current
        if (!hasActivity || !content) return

        const measure = () => setRecapHeight(content.getBoundingClientRect().height)
        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(content)
        return () => observer.disconnect()
    }, [hasActivity])

    const now = new Date()
    const monthCount = year === now.getFullYear() ? now.getMonth() + 1 : 12
    const currentIndex = now.getFullYear() === year ? now.getMonth() : -1
    const monthIndices = Array.from({ length: monthCount }, (_, index) => index)
    const orderedIndices = currentIndex >= 0 && currentIndex < monthCount
        ? [currentIndex, ...monthIndices.filter(index => index !== currentIndex)]
        : monthIndices
    const months = orderedIndices.map(index => ({ ...data.months[index], index }))
    const cellClass = (index : number) => index === currentIndex
        ? 'sticky left-36 z-10 bg-muted text-right tabular-nums border-r border-border'
        : 'text-right tabular-nums'
    const rowHeading = 'sticky left-0 z-20 w-36 bg-card px-3 text-center whitespace-normal break-words'

    return (
        <section className="min-w-0" aria-labelledby="comparison-heading">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 id="comparison-heading" className="text-base font-medium">Monthly recap</h2>
                <div className="flex items-center gap-2 text-sm">
                    <span>{year}</span>
                    <PeriodNavigation
                        disableNext={year >= now.getFullYear()}
                        nextLabel="Next year"
                        previousLabel="Previous year"
                        onNext={() => onYearChange(year + 1)}
                        onPrevious={() => onYearChange(year - 1)}
                        onReset={() => onYearChange(now.getFullYear())}
                        resetLabel="Reset to current year"
                        showReset={year !== now.getFullYear()}
                    />
                </div>
            </div>
            <Card className="min-w-0 py-0">
                <CardContent ref={contentRef} className="min-h-60 min-w-0 px-0">
                    {!hasActivity ? (
                        <p style={{ minHeight: recapHeight }} className="flex items-center justify-center px-4 text-center text-sm text-muted-foreground">
                            No expenses logged in {year}.
                        </p>
                    ) : (
                        <Table className="table-fixed" style={{ width: `${144 + months.length * 128}px` }} aria-label={`Monthly category spending for ${year}`}>
                            <colgroup>
                                <col style={{ width: 144 }} />
                                {months.map(({ index }) => <col key={index} style={{ width: 128 }} />)}
                            </colgroup>
                            <TableHeader>
                                <TableRow>
                                    <TableHead scope="col" className={rowHeading}>Category</TableHead>
                                    {months.map(({ index }) => (
                                        <TableHead scope="col" key={index} className={cellClass(index).replace('text-right', 'text-center')}>
                                            {format(new Date(year, index), 'MMM')}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableHead scope="row" className={rowHeading}>Income</TableHead>
                                    {months.map(({ index, ...month }) => <TableCell key={index} className={cellClass(index)}>{money(month.incomeCents)}</TableCell>)}
                                </TableRow>
                                {dashboardGroups.map(group => {
                                    const rows = data.rows.filter(row => row.group === group.id)
                                    if (rows.length === 0 && group.id === 'uncategorized') return null
                                    const expanded = !collapsedBuckets.has(group.id)
                                    const Chevron = expanded ? ChevronDown : ChevronRight
                                    return (
                                        <Fragment key={group.id}>
                                            <TableRow className="cursor-pointer font-medium hover:bg-transparent" onClick={() => toggleBucket(group.id)}>
                                                <TableHead scope="row" className={rowHeading}>
                                                    <Button
                                                        variant="ghost"
                                                        className="relative min-h-9 w-full whitespace-normal bg-transparent! px-5 text-sm"
                                                        aria-expanded={expanded}
                                                        aria-label={`${group.label} categories`}
                                                        onClick={event => {
                                                            event.stopPropagation()
                                                            toggleBucket(group.id)
                                                        }}
                                                    >
                                                        <Chevron aria-hidden="true" className="absolute left-0 size-3.5 text-muted-foreground" />
                                                        {group.label}
                                                    </Button>
                                                </TableHead>
                                                {months.map(({ index, ...month }) => <TableCell key={index} className={cellClass(index)}>{money(group.id === 'savings' ? month.totalSavingsCents : month[group.id])}</TableCell>)}
                                            </TableRow>
                                            {expanded && group.id === 'savings' && (
                                                <TableRow>
                                                    <TableHead scope="row" className={`${rowHeading} font-normal text-muted-foreground`}>Unspent</TableHead>
                                                    {months.map(({ index, unspentCents }) => <TableCell key={index} className={cellClass(index)}>{money(unspentCents)}</TableCell>)}
                                                </TableRow>
                                            )}
                                            {expanded && rows.map(row => (
                                                <TableRow key={row.id}>
                                                    <TableHead scope="row" className={`${rowHeading} font-normal text-muted-foreground`}>{row.name}</TableHead>
                                                    {months.map(({ index }) => <TableCell key={index} className={cellClass(index)}>{money(row.values[index])}</TableCell>)}
                                                </TableRow>
                                            ))}
                                        </Fragment>
                                    )
                                })}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableHead scope="row" className={rowHeading}>Total spent</TableHead>
                                    {months.map(({ index, ...month }) => <TableCell key={index} className={cellClass(index)}>{money(month.spentCents)}</TableCell>)}
                                </TableRow>
                            </TableFooter>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </section>
    )
}

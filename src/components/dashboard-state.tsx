import { Button } from "@/components/ui/button"
import {
    Card,
    CardAction,
    CardContent,
    CardHeader
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const chartBarHeights = [
    '38%',
    '56%',
    '72%',
    '48%',
    '64%',
    '82%',
    '58%',
    '76%',
    '44%',
    '68%',
    '52%',
    '74%'
]

function LoadingHeader() {
    return (
        <CardHeader>
            <Skeleton className="h-5.5 w-32" />
            <Skeleton className="h-5 w-20" />
            <CardAction>
                <Skeleton className="h-7 w-16" />
            </CardAction>
        </CardHeader>
    )
}

export function DashboardLoading() {
    return (
        <>
            <Card aria-busy="true" aria-label="Loading monthly overview">
                <LoadingHeader />
                <CardContent className="grid h-56 content-start gap-4 pt-2 sm:h-64 sm:gap-5">
                    {Array.from({length: 4}).map((_, index) => (
                        <div className="grid gap-2" key={index}>
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-3.5 w-full rounded-full" />
                        </div>
                    ))}
                </CardContent>
            </Card>
            <Card aria-busy="true" aria-label="Loading yearly overview">
                <LoadingHeader />
                <CardContent className="flex h-56 items-end gap-1.5 pt-4 sm:h-64 sm:gap-2">
                    {chartBarHeights.map((height, index) => (
                        <Skeleton
                            className="min-w-0 flex-1 rounded-t-md rounded-b-none"
                            key={index}
                            style={{height}}
                        />
                    ))}
                </CardContent>
            </Card>
        </>
    )
}

interface DashboardErrorProps {
    onRetry : () => void
}

export function DashboardError({onRetry} : DashboardErrorProps) {
    return (
        <Card role="alert">
            <CardContent className="flex h-56 flex-col items-center justify-center gap-3 text-center sm:h-64">
                <div className="grid gap-1">
                    <p className="font-medium">Could not load your dashboard</p>
                    <p className="text-xs text-muted-foreground">
                        Try loading your data again.
                    </p>
                </div>
                <Button type="button" variant="outline" onClick={onRetry}>
                    Retry
                </Button>
            </CardContent>
        </Card>
    )
}

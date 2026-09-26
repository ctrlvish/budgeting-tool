import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function DashboardLoading() {
    return (
        <div className="grid min-w-0 gap-8" aria-busy="true" aria-label="Loading dashboard">
            <Card>
                <CardContent className="grid gap-4 py-4">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-16 w-60 max-w-full" />
                    <Skeleton className="h-3 w-48" />
                    <Skeleton className="mt-4 h-6 w-full" />
                </CardContent>
            </Card>
            <div className="grid gap-4 sm:grid-cols-3">
                {Array.from({ length: 3 }, (_, index) => (
                    <Card key={index}>
                        <CardContent className="grid gap-4">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-9 w-32" />
                            <Skeleton className="h-2 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            <Card>
                <CardContent className="grid gap-5 py-2">
                    {Array.from({ length: 6 }, (_, index) => (
                        <Skeleton key={index} className="h-5 w-full" />
                    ))}
                </CardContent>
            </Card>
        </div>
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

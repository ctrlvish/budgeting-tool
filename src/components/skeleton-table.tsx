import { Skeleton } from "@/components/ui/skeleton"

export function SkeletonTable() {
  return (
    <div className="flex w-full flex-col gap-3 pb-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div className="flex gap-5" key={index}>
          <Skeleton className="h-6 flex-1" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  )
}
import { Skeleton } from "@/components/ui/skeleton"

export function SkeletonTable() {
  return (
    <div
      className="flex w-full flex-col pb-4"
      role="status"
      aria-label="Loading transactions"
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 border-b px-2 py-2.5 sm:grid-cols-[7rem_minmax(0,1fr)_10rem_8rem] sm:gap-2 sm:px-0 sm:py-3"
          key={index}
        >
          <Skeleton className="col-start-2 row-start-2 h-3 w-20 justify-self-end sm:col-start-auto sm:row-start-auto sm:h-6 sm:w-full" />
          <Skeleton className="col-start-1 row-start-1 h-4 w-36 sm:col-start-auto sm:row-start-auto sm:h-6 sm:w-full" />
          <Skeleton className="col-start-1 row-start-2 h-3 w-28 sm:col-start-auto sm:row-start-auto sm:h-6 sm:w-full" />
          <Skeleton className="col-start-2 row-start-1 h-4 w-16 sm:col-start-auto sm:row-start-auto sm:h-6 sm:w-full" />
        </div>
      ))}
    </div>
  )
}

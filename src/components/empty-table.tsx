interface EmptyTableProps {
    onAdd : () => void
}

export default function EmptyTable({onAdd}: EmptyTableProps){
    return (
    <div className="flex min-h-52 flex-col items-center justify-center text-center">
        <p>No logged transactions</p>
        <button
            type="button"
            className="cursor-pointer appearance-none border-0 bg-transparent! p-0 text-sm font-medium underline underline-offset-4 transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={onAdd}
        >add something</button>
    </div>
    )
}

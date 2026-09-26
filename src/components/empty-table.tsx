import { Button } from '@/components/ui/button'

interface EmptyTableProps {
    onAdd : () => void
}

export default function EmptyTable({onAdd}: EmptyTableProps){
    return (
    <div className="flex min-h-52 flex-col items-center justify-center text-center">
        <p>No logged transactions</p>
        <Button
            type="button"
            className="mt-3"
            onClick={onAdd}
        >add something</Button>
    </div>
    )
}

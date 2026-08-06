import { Button } from "./ui/button"

interface EmptyTableProps {
    onAdd : () => void
}

export default function EmptyTable({onAdd}: EmptyTableProps){
    return (
    <div className="flex min-h-52 flex-col items-center justify-center text-center">
        <p>wow such empty</p>
        <Button 
            variant="link"
            className="h-auto cursor-pointer p-0 underline hover:text-muted-foreground"
            onClick={onAdd}
        >add something</Button>
    </div>
    )
}

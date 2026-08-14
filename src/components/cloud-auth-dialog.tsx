import { useState } from 'react'
import {
    resolveText,
    type DXCInputField,
    type DXCOption,
    type DXCUserInteraction
} from 'dexie-cloud-addon'
import { useObservable } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function getInteractionDescription(type : DXCUserInteraction['type']) {
    if (type === 'email') {
        return 'Enter your email and we’ll send you a one-time code.'
    }

    if (type === 'otp') {
        return 'Enter the code sent to your email.'
    }

    return null
}

function getFieldLabel(fieldName : string, field : DXCInputField) {
    if (field.label) return field.label
    if (fieldName === 'email') return 'Email'
    if (fieldName === 'otp') return 'One-time code'

    return fieldName
}

function getInputType(field : DXCInputField) {
    if (field.type === 'password') return 'password'
    if (field.type === 'email') return 'email'

    return 'text'
}

function getPromptKey(ui : DXCUserInteraction) {
    const alertCodes = ui.alerts
        .map(alert => alert.messageCode)
        .join('-')

    return `${ui.type}-${ui.title}-${alertCodes}`
}

interface CloudAuthPromptProps {
    ui : DXCUserInteraction
}

function CloudAuthPrompt({ ui } : CloudAuthPromptProps) {
    const [params, setParams] = useState<Record<string, string>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const fieldEntries = Object.entries(ui.fields ?? {}) as [string, DXCInputField][]
    const options = 'options' in ui ? ui.options ?? [] : []
    const hasFields = fieldEntries.length > 0
    const hasOptions = options.length > 0
    const description = getInteractionDescription(ui.type)

    function handleSubmit(e : React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsSubmitting(true)
        ui.onSubmit(params)
    }

    function handleOptionClick(option : DXCOption) {
        setIsSubmitting(true)
        ui.onSubmit({ [option.name]: option.value })
    }

    function handleOpenChange(open : boolean) {
        if (!open && ui.cancelLabel && !isSubmitting) {
            ui.onCancel()
        }
    }

    return (
        <Dialog open onOpenChange={handleOpenChange}>
            <DialogContent
                className="w-[calc(100%-4rem)] sm:w-full"
                showCloseButton={Boolean(ui.cancelLabel)}
            >
                <form className="grid gap-4" onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{ui.title}</DialogTitle>
                        {description && (
                            <DialogDescription>{description}</DialogDescription>
                        )}
                    </DialogHeader>

                    {ui.alerts.length > 0 && (
                        <div className="grid gap-2" aria-live="polite">
                            {ui.alerts.map((alert, index) => (
                                <p
                                    className={
                                        alert.type === 'error'
                                            ? 'text-sm text-destructive'
                                            : 'text-sm text-muted-foreground'
                                    }
                                    key={`${alert.messageCode}-${index}`}
                                    role={alert.type === 'error' ? 'alert' : undefined}
                                >
                                    {resolveText(alert)}
                                </p>
                            ))}
                        </div>
                    )}

                    {hasOptions && (
                        <div className="grid gap-2">
                            {options.map(option => (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-10 w-full justify-center gap-2"
                                    disabled={isSubmitting}
                                    key={`${option.name}-${option.value}`}
                                    onClick={() => handleOptionClick(option)}
                                >
                                    {option.iconUrl && (
                                        <img
                                            src={option.iconUrl}
                                            alt=""
                                            className="size-4"
                                        />
                                    )}
                                    {option.displayName}
                                </Button>
                            ))}
                        </div>
                    )}

                    {hasOptions && hasFields && (
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="h-px flex-1 bg-border" />
                            <span>or</span>
                            <span className="h-px flex-1 bg-border" />
                        </div>
                    )}

                    {hasFields && (
                        <div className="grid gap-4">
                            {fieldEntries.map(([fieldName, field], index) => (
                                <div className="grid gap-2" key={fieldName}>
                                    <Label htmlFor={`cloud-auth-${fieldName}`}>
                                        {getFieldLabel(fieldName, field)}
                                    </Label>
                                    <Input
                                        id={`cloud-auth-${fieldName}`}
                                        name={fieldName}
                                        type={getInputType(field)}
                                        value={params[fieldName] ?? ''}
                                        placeholder={field.placeholder}
                                        autoComplete={
                                            fieldName === 'email'
                                                ? 'email'
                                                : fieldName === 'otp'
                                                    ? 'one-time-code'
                                                    : undefined
                                        }
                                        autoFocus={index === 0}
                                        disabled={isSubmitting}
                                        required
                                        onChange={e => setParams(previous => ({
                                            ...previous,
                                            [fieldName]: e.target.value
                                        }))}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    <DialogFooter className="flex-row justify-end bg-popover">
                        {ui.cancelLabel && (
                            <Button
                                type="button"
                                variant="outline"
                                disabled={isSubmitting}
                                onClick={ui.onCancel}
                            >
                                {ui.cancelLabel}
                            </Button>
                        )}
                        {(hasFields || !hasOptions) && (
                            <Button type="submit" disabled={isSubmitting}>
                                {ui.submitLabel}
                            </Button>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default function CloudAuthDialog() {
    const ui = useObservable(db.cloud.userInteraction)

    if (!ui) return null

    return <CloudAuthPrompt key={getPromptKey(ui)} ui={ui} />
}

import { useState } from "react"
import type { BudgetSetting } from '../types'
import { db } from '../lib/db'
import {
    Card,
    CardHeader,
    CardContent,
    CardAction,
    CardDescription,
    CardTitle
} from "./ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useLiveQuery } from 'dexie-react-hooks'
import { Info, GripVertical } from 'lucide-react'
import { Slider } from '@base-ui/react/slider'
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from '@/components/ui/popover'

type BudgetSettingsFormData = {
    startingSavingsBalance: string,
    needs: string,
    wants: string,
    savings: string
}

const defaultSettings: BudgetSettingsFormData = {
    startingSavingsBalance: '',
    needs: '50',
    wants: '30',
    savings: '20'
}

function budgetSettingsToFormData(settings : BudgetSetting) : BudgetSettingsFormData {
    return {
        startingSavingsBalance: String(settings.startingSavingsBalanceCents / 100),
        needs: String(settings.needs),
        wants: String(settings.wants),
        savings: String(settings.savings)
    }
}

function formDataToBudgetSettings(formData : BudgetSettingsFormData) : BudgetSetting {
    return {
        id: '#budget-settings',
        startingSavingsBalanceCents: Math.round(Number(formData.startingSavingsBalance) * 100),
        needs: Number(formData.needs),
        wants: Number(formData.wants),
        savings: Number(formData.savings)
    }
}

export default function BudgetSetup() {
    const [formDraft, setFormDraft] = useState<BudgetSettingsFormData | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    const savedSettings = useLiveQuery(
        () => db.budgetSettings.get('#budget-settings'),
        [],
        null
    )
    const formData =
        formDraft ??
        (savedSettings
            ? budgetSettingsToFormData(savedSettings)
            : defaultSettings)

    const isLoading = savedSettings === null

    const handleChange = (e : React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target

        setFormDraft((prevDraft) => ({
            ...(prevDraft ?? formData),
            [name] : value
        }))

    }

    const handleSubmit = async (e : React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (!isRatioValid) {
            toast.error('Budget targets must total 100%')
            return
        }

        setIsSaving(true)

        try {
            const settings = formDataToBudgetSettings(formData)

            await db.budgetSettings.put(settings)
            toast.success('Budget settings saved')
        } catch (error) {
            console.error('Failed to save budget settings', error)
            toast.error('Couldn’t save budget settings')
        } finally {
            setIsSaving(false)
        }
    }

    const isDisabled = isLoading || isSaving

    const needs = Number(formData.needs)
    const wants = Number(formData.wants)
    const savings = Number(formData.savings)
    const isRatioValid = [needs, wants, savings].every(value => Number.isFinite(value) && value >= 0 && value <= 100)
        && Math.abs(needs + wants + savings - 100) < 0.000001
    const boundaries = isRatioValid ? [needs, needs + wants] : [50, 80]

    function changeAllocation(values : number[]) {
        const first = Math.round(values[0])
        const second = Math.round(values[1])
        setFormDraft({
            ...formData,
            needs: String(first),
            wants: String(second - first),
            savings: String(100 - second)
        })
    }

    return (
        <Card className="w-full min-w-0">
            <CardHeader>
                <CardTitle>Budget targets</CardTitle>
                <CardDescription>One income, three buckets. Move the dividers to find your balance.</CardDescription>
                <CardAction>
                    <Button
                        type="submit"
                        form="budget-settings-form"
                        variant="outline"
                        className="h-10 px-4 sm:h-8"
                        disabled={isDisabled}
                    >
                        Save
                    </Button>
                </CardAction>
            </CardHeader>
            <CardContent>
                <form id="budget-settings-form" className="budget-form grid items-end gap-4" onSubmit={handleSubmit}>
                    <div className="allocation-editor">
                        <div className="allocation-values" aria-label="Budget percentages">
                            {([
                                ['Needs', needs, 'needs'],
                                ['Wants', wants, 'wants'],
                                ['Savings', savings, 'savings']
                            ] as const).map(([label, value, bucket]) => (
                                <div className={`allocation-value allocation-${bucket}`} key={bucket}>
                                    <span><i aria-hidden="true" />{label}</span>
                                    <strong>{value}<small>%</small></strong>
                                </div>
                            ))}
                        </div>
                        <Slider.Root
                            className="allocation-slider"
                            value={boundaries}
                            onValueChange={changeAllocation}
                            min={0}
                            max={100}
                            step={1}
                            thumbCollisionBehavior="none"
                            disabled={isDisabled}
                            aria-describedby="allocation-help"
                        >
                            <Slider.Control className="allocation-control">
                                <Slider.Track className="allocation-track">
                                    <span className="allocation-segment allocation-needs" style={{ width: `${boundaries[0]}%` }} />
                                    <span className="allocation-segment allocation-wants" style={{ width: `${boundaries[1] - boundaries[0]}%` }} />
                                    <span className="allocation-segment allocation-savings" style={{ width: `${100 - boundaries[1]}%` }} />
                                </Slider.Track>
                                <Slider.Thumb
                                    index={0}
                                    className="allocation-thumb"
                                    getAriaLabel={() => 'Needs and wants divider'}
                                    getAriaValueText={() => `${needs}% needs, ${wants}% wants, ${savings}% savings`}
                                ><GripVertical aria-hidden="true" /></Slider.Thumb>
                                <Slider.Thumb
                                    index={1}
                                    className="allocation-thumb"
                                    getAriaLabel={() => 'Wants and savings divider'}
                                    getAriaValueText={() => `${needs}% needs, ${wants}% wants, ${savings}% savings`}
                                ><GripVertical aria-hidden="true" /></Slider.Thumb>
                            </Slider.Control>
                        </Slider.Root>
                        <p id="allocation-help" className="allocation-help">Drag a divider to shift the two buckets beside it. Total stays at 100%.<span>Or focus a divider and use the arrow keys for 1% steps.</span></p>
                    </div>

                    <div className="starting-balance grid gap-2">
                        <div className="flex items-center gap-1.5">
                            <Label htmlFor='startingSavingsBalanceInput'>Starting savings balance</Label>
                            <Popover>
                                <PopoverTrigger
                                    openOnHover
                                    delay={250}
                                    render={
                                        <button
                                            type="button"
                                            className="cursor-pointer text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            aria-label="About starting savings balance"
                                        />
                                    }
                                >
                                    <Info className="size-3.5" />
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-64 text-xs leading-relaxed text-muted-foreground"
                                    side="top"
                                    align="start"
                                    sideOffset={6}
                                >
                                    What you had before you began logging. This is the baseline for your savings balance.
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="relative">
                            <span
                                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
                                aria-hidden="true"
                            >
                                $
                            </span>
                            <Input
                                className="h-10 pl-6 sm:h-8"
                                type='number'
                                inputMode="decimal"
                                step='0.01'
                                id="startingSavingsBalanceInput"
                                name="startingSavingsBalance"
                                value={formData.startingSavingsBalance}
                                onChange={handleChange}
                                disabled={isDisabled}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                </form>
                <div aria-live="polite">

                    {!isRatioValid && (
                        <p id="budget-ratio-message" className="mt-3 text-sm font-medium text-destructive">
                            These targets need to add up to 100%. Move a divider to set a new plan.
                        </p>
                    )}
                </div>
            </CardContent>

        </Card>
    )
}

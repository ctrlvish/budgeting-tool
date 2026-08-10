import { useEffect, useState } from "react"
import type { BudgetSetting } from '../types'
import { db } from '../lib/db'
import { 
    Card, 
    CardHeader,
    CardContent,
    CardFooter,
    CardDescription,
    CardTitle
} from "./ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

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
        startingSavingsBalanceCents: Math.round(Number(formData.startingSavingsBalance) * 100),
        needs: Number(formData.needs),
        wants: Number(formData.wants),
        savings: Number(formData.savings)
    }
}

export default function BudgetSetup() {
    const [formData, setFormData] = useState<BudgetSettingsFormData>(defaultSettings)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        let isActive = true

        db.budgetSettings.toArray()
            .then(records => {
                if (isActive && records[0]) {
                    setFormData(budgetSettingsToFormData(records[0]))
                }
            })
            .catch(error => {
                console.error('Failed to load budget settings', error)

                if (isActive) {
                    setError('Could not load budget settings')
                }
            })
            .finally(() => {
                if (isActive) {
                    setIsLoading(false)
                }
            })

        return () => {
            isActive = false
        }
    }, [])

    const handleChange = (e : React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target

        setFormData((prevData) => ({
            ...prevData,
            [name] : value
        }))

    }

    const handleSubmit = async (e : React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSaving(true)
        setError('')

        try {
            const settings = formDataToBudgetSettings(formData)

            await db.budgetSettings.clear()
            await db.budgetSettings.add(settings)
        } catch (error) {
            console.error('Failed to save budget settings', error)
            setError('Could not save budget settings')
        } finally {
            setIsSaving(false)
        }
    }

    const isDisabled = isLoading || isSaving

    const total =
        Number(formData.needs) +
        Number(formData.wants) +
        Number(formData.savings)

    const isRatioValid = total === 100

    const ratioMessage = total < 100
        ? `${100 - total}% left to allocate`
        : `${Math.abs(100 - total)}% over allocation`

    return (
        <Card className="w-full min-w-0">
            <CardHeader>
                <CardTitle>Budget setup</CardTitle>
                <CardDescription>Set savings and targets</CardDescription>
            </CardHeader>
            <CardContent>
                <form id="budget-settings-form" className="grid gap-5 sm:gap-6" onSubmit={handleSubmit}>
                    <div className="grid gap-2">
                        <Label htmlFor='startingSavingsBalanceInput'>Starting savings balance</Label>
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

                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        <div className="grid gap-2">
                            <Label htmlFor='needsInput'>Needs (%)</Label>
                            <Input
                                className="h-10 sm:h-8"
                                type='number'
                                id="needsInput"
                                name="needs"
                                value={formData.needs}
                                onChange={handleChange}
                                disabled={isDisabled}
                                placeholder="50"
                                aria-required="true"
                                aria-invalid={!isRatioValid}
                                aria-describedby={!isRatioValid ? 'budget-ratio-message' : undefined}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor='wantsInput'>Wants (%)</Label>
                            <Input
                                className="h-10 sm:h-8"
                                type='number'
                                id="wantsInput"
                                name="wants"
                                value={formData.wants}
                                onChange={handleChange}
                                disabled={isDisabled}
                                placeholder="30"
                                aria-required="true"
                                aria-invalid={!isRatioValid}
                                aria-describedby={!isRatioValid ? 'budget-ratio-message' : undefined}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor='savingsInput'>Savings (%)</Label>
                            <Input
                                className="h-10 sm:h-8"
                                type='number'
                                id="savingsInput"
                                name="savings"
                                value={formData.savings}
                                onChange={handleChange}
                                disabled={isDisabled}
                                placeholder="20"
                                aria-required="true"
                                aria-invalid={!isRatioValid}
                                aria-describedby={!isRatioValid ? 'budget-ratio-message' : undefined}
                            />
                        </div>
                    </div>

                    {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
                </form>
            </CardContent>
            <CardFooter className="items-center justify-between gap-3">
                <div className="min-h-5" aria-live="polite">
                    {!isRatioValid && (
                        <p id="budget-ratio-message" className="text-sm font-medium text-destructive">
                            {ratioMessage}
                        </p>
                    )}
                </div>
                <Button
                    type="submit"
                    form="budget-settings-form"
                    variant="outline"
                    className="h-10 px-4 sm:h-8"
                    disabled={isDisabled || !isRatioValid}
                >
                    {isLoading ? 'Loading...' : 'Save'}
                </Button>
            </CardFooter>
        </Card>
    )
}

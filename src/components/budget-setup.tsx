import { useEffect, useState } from "react"
import type { BudgetSetting } from '../types'
import { db } from '../lib/db'
import { 
    Card, 
    CardHeader,
    CardContent,
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
        startingSavingsBalance: String(settings.startingSavingsBalance),
        needs: String(settings.needs),
        wants: String(settings.wants),
        savings: String(settings.savings)
    }
}

function formDataToBudgetSettings(formData : BudgetSettingsFormData) : BudgetSetting {
    return {
        startingSavingsBalance: Number(formData.startingSavingsBalance),
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

    const ratioMessage =
        total === 100
            ? '100% allocated'
            : total < 100
                ? `${100 - total}% left to allocate`
                : `${Math.abs(100 - total)}% over allocation`

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Budget Setup</CardTitle>
                <CardDescription>Set your savings baseline and allocation targets.</CardDescription>
            </CardHeader>
            <CardContent>
                <form className="grid gap-6" onSubmit={handleSubmit}>
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
                                className="pl-6"
                                type='number'
                                id="startingSavingsBalanceInput"
                                name="startingSavingsBalance"
                                value={formData.startingSavingsBalance}
                                onChange={handleChange}
                                disabled={isDisabled}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="grid gap-3">
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="grid gap-2">
                                <Label htmlFor='needsInput'>Needs (%)</Label>
                                <Input
                                    type='number'
                                    id="needsInput"
                                    name="needs"
                                    value={formData.needs}
                                    onChange={handleChange}
                                    disabled={isDisabled}
                                    placeholder="50"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor='wantsInput'>Wants (%)</Label>
                                <Input
                                    type='number'
                                    id="wantsInput"
                                    name="wants"
                                    value={formData.wants}
                                    onChange={handleChange}
                                    disabled={isDisabled}
                                    placeholder="30"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor='savingsInput'>Savings (%)</Label>
                                <Input
                                    type='number'
                                    id="savingsInput"
                                    name="savings"
                                    value={formData.savings}
                                    onChange={handleChange}
                                    disabled={isDisabled}
                                    placeholder="20"
                                />
                            </div>
                        </div>
                        <p
                            className={`text-sm font-medium ${isRatioValid ? 'text-green-600' : 'text-destructive'}`}
                            aria-live="polite"
                        >
                            {ratioMessage}
                        </p>
                    </div>

                    <div className="grid gap-3">
                        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
                        <Button type="submit" disabled={isDisabled || !isRatioValid}>
                            {isLoading ? 'Loading...' : isSaving ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}

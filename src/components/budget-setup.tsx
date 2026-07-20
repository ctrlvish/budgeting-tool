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
    monthlyIncome: string,
    startingSavingsBalance: string,
    needs: string,
    wants: string,
    savings: string
}

const defaultSettings: BudgetSettingsFormData = {
    monthlyIncome: '',
    startingSavingsBalance: '',
    needs: '50',
    wants: '30',
    savings: '20'
}

function budgetSettingsToFormData(settings : BudgetSetting) : BudgetSettingsFormData {
    return {
        monthlyIncome: String(settings.monthlyIncome),
        startingSavingsBalance: String(settings.startingSavingsBalance),
        needs: String(settings.needs),
        wants: String(settings.wants),
        savings: String(settings.savings)
    }
}

function formDataToBudgetSettings(formData : BudgetSettingsFormData) : BudgetSetting {
    return {
        monthlyIncome: Number(formData.monthlyIncome),
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

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Budget Setup</CardTitle>
                <CardDescription>Set your income and monthly allocation targets.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor='monthlyIncomeInput'>Monthly Income:</Label>
                            <Input
                                type='number'
                                id="monthlyIncomeInput"
                                name="monthlyIncome"
                                value={formData.monthlyIncome}
                                onChange={handleChange}
                                disabled={isDisabled}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor='startingSavingsBalanceInput'>Starting savings balance:</Label>
                            <Input
                                type='number'
                                id="startingSavingsBalanceInput"
                                name="startingSavingsBalance"
                                value={formData.startingSavingsBalance}
                                onChange={handleChange}
                                disabled={isDisabled}
                            />
                        </div>
                        <div className="flex justify-between">
                        <div className="grid gap-2">
                            <Label htmlFor='needsInput'>Needs:</Label>
                            <Input
                                type='number'
                                id="needsInput"
                                name="needs"
                                value={formData.needs}
                                onChange={handleChange}
                                disabled={isDisabled}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor='wantsInput'>Wants:</Label>
                            <Input
                                type='number'
                                id="wantsInput"
                                name="wants"
                                value={formData.wants}
                                onChange={handleChange}
                                disabled={isDisabled}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor='savingsInput'>Savings:</Label>
                            <Input
                                type='number'
                                id="savingsInput"
                                name="savings"
                                value={formData.savings}
                                onChange={handleChange}
                                disabled={isDisabled}
                            />
                        </div>
                        </div>
                        <p className={isRatioValid ? 'text-green-600' : 'text-red-600'}>
                        Total: {total}%
                        </p>
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

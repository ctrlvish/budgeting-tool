import { useEffect, useState } from "react";
import type { BudgetSetting } from '../types'
import { useBudgetSettings } from "../hooks/useBudgetSettings";


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

export default function Settings(){
    const { settings, save } = useBudgetSettings()

    const [formData, setFormData] = useState<BudgetSettingsFormData>(defaultSettings)

    const handleChange = (e : React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target

        setFormData((prevData) => ({
            ...prevData,
            [name] : value
        }))

    }

    const handleSubmit = (e : React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault()

        save(formDataToBudgetSettings(formData))
    }

    useEffect(() => {
        if (settings) {
            setFormData(budgetSettingsToFormData(settings))
        }
    }, [settings])

    return (
    <form onSubmit={handleSubmit}>
        <label htmlFor='monthlyIncomeInput'>Monthly Income:</label>
        <input 
            type = 'number' 
            id="monthlyIncomeInput"
            name="monthlyIncome"
            value={formData.monthlyIncome}
            onChange={handleChange}
        ></input>
        
        <label htmlFor='startingSavingsBalanceInput'>Starting savings balance:</label>
        <input 
            type = 'number' 
            id="startingSavingsBalanceInput"
            name="startingSavingsBalance"
            value={formData.startingSavingsBalance}
            onChange={handleChange}
        ></input>

        <label htmlFor='needsInput'>Needs:</label>
        <input 
            type = 'number' 
            id="needsInput"
            name="needs"
            value={formData.needs}
            onChange={handleChange}
        ></input>

        <label htmlFor='wantsInput'>Wants:</label>
        <input 
            type = 'number' 
            id="wantsInput"
            name="wants"
            value={formData.wants}
            onChange={handleChange}
        ></input>

        <label htmlFor='savingsInput'>Savings:</label>
        <input 
            type = 'number' 
            id="savingsInput"
            name="savings"
            value={formData.savings}
            onChange={handleChange}
        ></input>

        <button type="submit">save</button>
    </form>
    )
}

import { useEffect, useState } from "react";
import type { BudgetSetting } from '../types'
import { useBudgetSettings } from "../hooks/useBudgetSettings";

const defaultSettings: BudgetSetting = {
    monthlyIncome: 0,
    startingSavingsBalance: 0,
    needs: 50,
    wants: 30,
    savings: 20
}

export default function Settings(){
    const { settings, save } = useBudgetSettings()

    const [formData, setFormData] = useState<BudgetSetting>(defaultSettings)

    const handleChange = (e : React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target

        setFormData((prevData) => ({
            ...prevData,
            [name] : Number(value)
        }))

    }

    const handleSubmit = (e : React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault()
        save(formData)
    }

    useEffect(() => {
        settings && setFormData(settings)
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

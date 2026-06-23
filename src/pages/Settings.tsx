import { useEffect, useState } from "react";
import type { BudgetSetting } from '../types'
import { useBudgetSettings } from "../hooks/useBudgetSettings";

export default function Settings(){
    const { settings, save } = useBudgetSettings()

    return (
    <>
    <label htmlFor='monthlyIncomeInput'>Monthly Income:</label>
    <input type = 'text' id="monthlyIncomeInput"></input>
    
    <label htmlFor='startingSavingsInput'>Starting savings balance:</label>
    <input type = 'text' id="startingSavingsInput"></input>

    <label htmlFor='needsInput'>Needs:</label>
    <input type = 'text' id="needsInput"></input>

    <label htmlFor='wantsInput'>Wants:</label>
    <input type = 'text' id="wantsInput"></input>

    <label htmlFor='savingsInput'>Savings:</label>
    <input type = 'text' id="savingsInput"></input>

    <button>save</button>
    </>
    )
}
import { useState, useEffect } from 'react'
import type { BudgetSetting } from '../types'
import { db } from '../lib/db'

export function useBudgetSettings(){
    const [settings, setSettings] = useState<BudgetSetting | null>(null)

    useEffect(() => {
        db.budgetSettings.toArray().then(records => {
            if (records[0]) setSettings(records[0])
        })
    }, [])

    const save = async (data : BudgetSetting) => {
        await db.budgetSettings.clear()
        await db.budgetSettings.add(data)

        console.log(await db.budgetSettings.toArray())
        
        setSettings(data)
    }

    return {settings, save}
}
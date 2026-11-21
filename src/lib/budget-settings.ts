import { db } from './db'
import type { BudgetSetting } from '../types'

export type BudgetRatios = Pick<BudgetSetting, 'needs' | 'wants' | 'savings'>
export const defaultBudgetSettings: BudgetSetting = {
    id: '#budget-settings', startingSavingsBalanceCents: 0,
    needs: 50, wants: 30, savings: 20
}

export const getRatios = ({ needs, wants, savings }: BudgetRatios): BudgetRatios => ({ needs, wants, savings })

/** Patch only the edited fields, reading the latest record inside the write transaction. */
export async function patchBudgetSettings(patch: BudgetRatios | Pick<BudgetSetting, 'startingSavingsBalanceCents'>) {
    return db.transaction('rw', db.budgetSettings, async () => {
        const existing = await db.budgetSettings.get(defaultBudgetSettings.id)
        const previous = existing ?? defaultBudgetSettings
        if (existing) await db.budgetSettings.update(existing.id, patch)
        else await db.budgetSettings.put({ ...defaultBudgetSettings, ...patch })
        return previous
    })
}

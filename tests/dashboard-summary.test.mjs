import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/lib/dashboard-summary.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } })
const { getDashboardYear, getSpendingBudget } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
const categories = [
    { id: 'rent', name: 'Rent', bucket: 'needs', type: 'expense' },
    { id: 'food', name: 'Eating out', bucket: 'wants', type: 'expense' },
    { id: 'stocks', name: 'Stocks', bucket: 'savings', type: 'expense' }
]
const transaction = (categoryId, amountCents, date = '2026-09-01', type = 'expense') => ({ id: `${categoryId}-${date}`, categoryId, amountCents, date, type })

function september(savings = 0) {
    return getDashboardYear([
        transaction('salary', 600000, '2026-09-01', 'income'),
        transaction('rent', 270000),
        transaction('food', 138000),
        transaction('stocks', savings)
    ], categories, 2026).months[8]
}

test('reserves the savings target without deducting contributions twice', () => {
    for (const contributed of [0, 60000, 120000]) {
        assert.equal(getSpendingBudget(september(contributed)).remainingCents, 72000)
    }
    assert.equal(getSpendingBudget(september(150000)).remainingCents, 42000)
})

test('uses custom targets and reconciles cent rounding', () => {
    const result = getSpendingBudget(september(), { needs: 55, wants: 15, savings: 30 })
    assert.equal(result.needsTarget, 330000)
    assert.equal(result.wantsTarget, 90000)
    assert.equal(result.remainingCents, 12000)
    const oddIncome = { ...september(), incomeCents: 101 }
    const rounded = getSpendingBudget(oddIncome)
    assert.equal(rounded.needsTarget + rounded.wantsTarget + rounded.savingsTarget, 101)
})

test('keeps unknown expenses, savings, months, and years correctly separated', () => {
    const result = getDashboardYear([
        transaction('salary', 600000, '2026-09-01', 'income'),
        transaction('rent', 200000),
        transaction('missing', 1234),
        transaction('stocks', 120000),
        transaction('rent', 300000, '2026-08-01'),
        transaction('rent', 900000, '2025-09-01')
    ], categories, 2026)
    assert.equal(result.months[8].spentCents, 201234)
    assert.equal(result.months[8].savings, 120000)
    assert.equal(result.months[8].uncategorized, 1234)
    assert.equal(result.rows.find(row => row.id === 'missing').values[8], 1234)
    assert.equal(result.months[7].spentCents, 300000)
    assert.equal(result.months[0].hasActivity, false)
    assert.equal(result.rows.find(row => row.id === 'rent').values[8], 200000)
})

test('represents no income and overspending without invalid numbers', () => {
    const empty = getDashboardYear([], [], 2026).months[0]
    assert.equal(getSpendingBudget(empty).remainingCents, 0)
    assert.equal(getSpendingBudget({ ...empty, spentCents: 5000 }).remainingCents, -5000)
    assert.equal(getSpendingBudget({ ...september(), spentCents: 500000 }).remainingCents, -20000)
})

test('recap savings includes unspent funds without double counting contributions', () => {
    const month = september(120000)
    assert.equal(month.unspentCents, 72000)
    assert.equal(month.totalSavingsCents, 192000)
    assert.equal(month.savings + month.unspentCents, month.totalSavingsCents)
    const overspent = getDashboardYear([
        transaction('salary', 10000, '2026-09-01', 'income'),
        transaction('rent', 15000),
        transaction('stocks', 2000)
    ], categories, 2026).months[8]
    assert.equal(overspent.unspentCents, -7000)
    assert.equal(overspent.totalSavingsCents, -5000)
})

test('keeps configured categories with zero spending', () => {
    const result = getDashboardYear([], categories, 2026)
    assert.equal(result.rows.length, categories.length)
    assert.ok(result.rows.every(row => row.values.every(value => value === 0)))
    assert.equal(result.months[0].totalSavingsCents, 0)
})

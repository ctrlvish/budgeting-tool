import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/lib/budget-allocation.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } })
const { rebalanceAllocation } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
const initial = { needs: 50, wants: 30, savings: 20 }
const buckets = ['needs', 'wants', 'savings']

test('changing one bucket shares the remainder in the original proportions', () => {
    assert.deepEqual(rebalanceAllocation(initial, 'needs', 60), { needs: 60, wants: 24, savings: 16 })
    assert.deepEqual(rebalanceAllocation(initial, 'savings', 40), { needs: 38, wants: 22, savings: 40 })
    assert.deepEqual(initial, { needs: 50, wants: 30, savings: 20 })
})

test('holding savings steady transfers percentage points between needs and wants', () => {
    assert.deepEqual(rebalanceAllocation(initial, 'needs', 60, 'savings'), { needs: 60, wants: 20, savings: 20 })
    assert.deepEqual(rebalanceAllocation(initial, 'needs', 99, 'savings'), { needs: 80, wants: 0, savings: 20 })
    assert.deepEqual(rebalanceAllocation(initial, 'savings', 50, 'savings'), initial)
})

test('zero-size buckets recover, and invalid requests leave the plan alone', () => {
    assert.deepEqual(rebalanceAllocation({ needs: 100, wants: 0, savings: 0 }, 'needs', 50), { needs: 50, wants: 25, savings: 25 })
    assert.deepEqual(rebalanceAllocation(initial, 'needs', NaN), initial)
    assert.deepEqual(rebalanceAllocation(initial, 'needs', Infinity), initial)
})

test('all target and lock combinations stay bounded, preserve locked values and total 100', () => {
    for (const needs of [0, 1, 33, 50, 99, 100]) {
        for (const wants of [0, 1, 30, 100 - needs].filter(value => value + needs <= 100)) {
            const basis = { needs, wants, savings: 100 - needs - wants }
            for (const selected of buckets) for (const locked of [null, ...buckets]) {
                for (const request of [-1, 0, 1, 30, 50, 99, 100, 101]) {
                    const result = rebalanceAllocation(basis, selected, request, locked)
                    assert.equal(Object.values(result).reduce((a, b) => a + b), 100)
                    assert.ok(Object.values(result).every(value => value >= 0 && value <= 100))
                    if (locked) assert.equal(result[locked], basis[locked])
                }
            }
        }
    }
})

import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/lib/money.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } })
const { parseAmountSearchCents } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)

test('search amounts accept dollars, decimals, currency and grouping', () => {
    for (const [query, expected] of [['35',3500],['35.00',3500],['35.5',3550],['35.50',3550],['$1,200',120000],['  $ 1,200.50  ',120050],['.50',50],['0',0],['0.29',29],['50,000,000',5000000000]]) {
        assert.equal(parseAmountSearchCents(query), expected, query)
    }
})

test('non-amount and malformed queries do not become numeric matches', () => {
    for (const query of ['', ' ', '$', 'Lunch', 'invoice 35', '12,34', '35.501', '-35', '1e3', 'Infinity', '50,000,001']) {
        assert.equal(parseAmountSearchCents(query), null, query)
    }
})

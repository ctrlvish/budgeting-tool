import type { Bucket } from '../types'

export type Allocation = Record<Bucket, number>
const buckets: Bucket[] = ['needs', 'wants', 'savings']
const precise = (value: number) => Math.round(value * 1e6) / 1e6

/** Rebalance from an interaction's starting values to avoid cumulative rounding drift. */
export function rebalanceAllocation(
    basis: Allocation,
    selected: Bucket,
    requested: number,
    locked: Bucket | null = null
): Allocation {
    if (!Number.isFinite(requested) || locked === selected) return { ...basis }
    const maximum = 100 - (locked ? basis[locked] : 0)
    const target = Math.max(0, Math.min(maximum, Math.round(requested)))
    const next = { ...basis, [selected]: target }
    const others = buckets.filter(bucket => bucket !== selected && bucket !== locked)
    const remaining = precise(maximum - target)

    if (locked) {
        next[others[0]] = remaining
    } else {
        const weight = basis[others[0]] + basis[others[1]]
        next[others[0]] = Math.min(remaining, Math.round(weight > 0
            ? remaining * basis[others[0]] / weight
            : remaining / 2))
        next[others[1]] = precise(remaining - next[others[0]])
    }
    return next
}

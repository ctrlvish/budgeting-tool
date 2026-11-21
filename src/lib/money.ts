export const MAX_TRANSACTION_AMOUNT_CENTS = 5_000_000_000

/** Interpret a search as a dollar amount, optionally including $ and thousands separators. */
export function parseAmountSearchCents(query: string): number | null {
    const trimmed = query.trim()
    if (!/^\$?\s*(?:(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{0,2})?|\.\d{1,2})$/.test(trimmed)) return null
    const cents = Math.round(Number(trimmed.replace(/[$,\s]/g, '')) * 100)
    return Number.isSafeInteger(cents) && cents <= MAX_TRANSACTION_AMOUNT_CENTS ? cents : null
}

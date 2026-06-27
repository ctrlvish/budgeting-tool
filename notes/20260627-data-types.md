### picking data types for inputs and db

initially wanted the form data to just use `BudgetSetting` directly since its all numbers and thats also what the db stores. But the problem is html inputs always give back strings, even when the input is `type="number"`.

issue is when I converted the input value to a number inside `handleChange`, clearing an input didnt work properly. Empty string becomes `0` with `Number("")`, so the input kept putting the 0 back.

So the form needs its own type with strings, because the form is just the draft state while I am typing:

```ts
type BudgetSettingsFormData = {
    monthlyIncome: string,
    startingSavingsBalance: string,
    needs: string,
    wants: string,
    savings: string
}
```

Then `BudgetSetting` stays as numbers because thats the actual saved data for dexie / app logic:

```ts
export interface BudgetSetting {
    monthlyIncome : number
    startingSavingsBalance : number
    needs : number
    wants : number
    savings : number
}
```

So the flow is:
1. dexie stores numbers
2. when settings load, convert numbers to strings for the form
3. while typing, keep values as strings so empty inputs are allowed
4. on submit, convert strings back to numbers and save to dexie

moved the annoying conversion into helper functions so the component isnt full of `String(...)` and `Number(...)` everywhere.

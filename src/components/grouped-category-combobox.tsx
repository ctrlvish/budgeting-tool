import type { Category, CategoryGroup } from '@/types'
import {
    Combobox,
    ComboboxCollection,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxGroup,
    ComboboxInput,
    ComboboxItem,
    ComboboxLabel,
    ComboboxList
} from '@/components/ui/combobox'

const categoryGroups : CategoryGroup[] = ['income', 'needs', 'wants', 'savings']

const categoryGroupLabels : Record<CategoryGroup, string> = {
    income: 'Income',
    needs: 'Needs',
    wants: 'Wants',
    savings: 'Savings'
}

interface GroupedCategoryComboboxProps {
    categories : Category[]
    value : string | null
    onValueChange : (categoryId : string | null) => void
    disabled? : boolean
    id? : string
    placeholder? : string
    className? : string
    ariaDescribedBy? : string
    ariaInvalid? : boolean
    ariaRequired? : boolean
}

export default function GroupedCategoryCombobox({
    categories,
    value,
    onValueChange,
    disabled = false,
    id,
    placeholder = 'Assign a category',
    className = 'w-full',
    ariaDescribedBy,
    ariaInvalid,
    ariaRequired
} : GroupedCategoryComboboxProps) {
    const groupedCategories = categoryGroups
        .map(group => ({
            group,
            label: categoryGroupLabels[group],
            items: categories.filter(category => {
                if (group === 'income') {
                    return category.type === 'income'
                }

                return category.type === 'expense' && category.bucket === group
            })
        }))
        .filter(group => group.items.length > 0)

    return (
        <Combobox
            items={groupedCategories}
            value={categories.find(category => category.id === value) ?? null}
            onValueChange={category => onValueChange(category?.id ?? null)}
            itemToStringLabel={category => category.name}
            itemToStringValue={category => category.id}
            isItemEqualToValue={(category, selectedCategory) => category.id === selectedCategory.id}
            disabled={disabled || categories.length === 0}
            autoHighlight
        >
            <ComboboxInput
                id={id}
                className={className}
                placeholder={placeholder}
                disabled={disabled || categories.length === 0}
                aria-describedby={ariaDescribedBy}
                aria-invalid={ariaInvalid}
                aria-required={ariaRequired}
            />
            <ComboboxContent>
                <ComboboxEmpty>No categories found.</ComboboxEmpty>
                <ComboboxList>
                    {(group : (typeof groupedCategories)[number]) => (
                        <ComboboxGroup key={group.group} items={group.items}>
                            <ComboboxLabel>{group.label}</ComboboxLabel>
                            <ComboboxCollection>
                                {(category : Category) => (
                                    <ComboboxItem key={category.id} value={category}>
                                        {category.name}
                                    </ComboboxItem>
                                )}
                            </ComboboxCollection>
                        </ComboboxGroup>
                    )}
                </ComboboxList>
            </ComboboxContent>
        </Combobox>
    )
}

import { useRef, useState } from 'react'
import { db } from '@/lib/db'
import { defaultBudgetSettings, getRatios, patchBudgetSettings, type BudgetRatios } from '@/lib/budget-settings'
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from './ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useLiveQuery } from 'dexie-react-hooks'
import { Info, GripVertical, Check } from 'lucide-react'
import AnimatedPercentage from './animated-percentage'
import { Slider } from '@base-ui/react/slider'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

function snapRatios(values: number[]): BudgetRatios {
    const first = Math.round(values[0] / 5) * 5
    const second = Math.round(values[1] / 5) * 5
    return { needs: first, wants: second - first, savings: 100 - second }
}

type SaveStatus = 'idle' | 'editing' | 'saving' | 'saved' | 'error'

export default function BudgetSetup() {
    const savedSettings = useLiveQuery(() => db.budgetSettings.get('#budget-settings'), [], null)
    const isLoading = savedSettings === null
    const settings = savedSettings ?? defaultBudgetSettings
    const [isEditingTargets, setIsEditingTargets] = useState(false)
    const touchGesture = useRef<{ x: number; y: number; axis: 'horizontal' | 'vertical' | null } | null>(null)
    const [ratioDraft, setRatioDraft] = useState<BudgetRatios | null>(null)
    const [ratioStatus, setRatioStatus] = useState<SaveStatus>('idle')
    const [undoRatios, setUndoRatios] = useState<BudgetRatios | null>(null)
    const ratioRevision = useRef(0)
    const [balanceDraft, setBalanceDraft] = useState<string | null>(null)
    const [balanceStatus, setBalanceStatus] = useState<SaveStatus>('idle')
    const [balanceError, setBalanceError] = useState('')
    const { needs, wants, savings } = ratioDraft ?? settings
    const isRatioValid = [needs, wants, savings].every(value => Number.isFinite(value) && value >= 0 && value <= 100)
        && Math.abs(needs + wants + savings - 100) < 0.000001
    const boundaries = isRatioValid ? [needs, needs + wants] : [50, 80]
    const balanceInput = balanceDraft ?? (savedSettings ? String(settings.startingSavingsBalanceCents / 100) : '')
    const balanceCents = Math.round(Number(balanceInput) * 100)
    const balanceDirty = balanceDraft !== null && balanceCents !== settings.startingSavingsBalanceCents

    function changeAllocation(values: number[], details: Slider.Root.ChangeEventDetails) {
        if (!isEditingTargets || ratioStatus === 'saving') return
        const gesture = touchGesture.current
        if (gesture && (details.reason === 'drag' || details.reason === 'track-press')) {
            const event = details.event
            const point = 'touches' in event ? event.touches[0] : 'clientX' in event ? event : null
            if (!point) return
            const dx = Math.abs(point.clientX - gesture.x)
            const dy = Math.abs(point.clientY - gesture.y)
            if (!gesture.axis && Math.max(dx, dy) >= 8) {
                gesture.axis = dx > dy ? 'horizontal' : 'vertical'
            }
            if (gesture.axis !== 'horizontal') return
        }
        ratioRevision.current += 1
        setRatioDraft(snapRatios(values))
        setRatioStatus('editing')
    }

    async function persistRatios(next: BudgetRatios, offerUndo = true) {
        const revision = ++ratioRevision.current
        setRatioDraft(next)
        setRatioStatus('saving')
        try {
            const previous = await patchBudgetSettings(next)
            if (revision !== ratioRevision.current) return
            setRatioDraft(null)
            setRatioStatus('saved')
            setIsEditingTargets(false)
            setUndoRatios(offerUndo ? getRatios(previous) : null)
        } catch (error) {
            console.error('Failed to save budget targets', error)
            if (revision === ratioRevision.current) setRatioStatus('error')
        }
    }

    async function saveBalance(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault()
        if (!balanceInput.trim() || !Number.isFinite(Number(balanceInput)) || !Number.isSafeInteger(balanceCents)) {
            setBalanceError('Enter a valid starting balance.')
            return
        }
        setBalanceStatus('saving')
        setBalanceError('')
        try {
            await patchBudgetSettings({ startingSavingsBalanceCents: balanceCents })
            setBalanceDraft(null)
            setBalanceStatus('saved')
        } catch (error) {
            console.error('Failed to save starting balance', error)
            setBalanceStatus('error')
            setBalanceError('Couldn’t save your starting balance. Try again.')
        }
    }

    return (
        <Card className="w-full min-w-0">
            <CardHeader>
                <CardTitle>Budget targets</CardTitle>
                <CardDescription>One income, three buckets.</CardDescription>
            </CardHeader>
            <CardContent className="budget-settings-content">
                {isLoading ? (
                    <div className="grid min-h-80 content-start gap-6" role="status" aria-label="Loading budget targets">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="mt-8 h-16 w-full max-w-110" />
                    </div>
                ) : <>

                <div className="allocation-editor">
                    <div className="allocation-values" aria-label="Budget percentages">
                        {([
                            ['Needs', needs, 'needs'],
                            ['Wants', wants, 'wants'],
                            ['Savings', savings, 'savings']
                        ] as const).map(([label, value, bucket]) => (
                            <div className={`allocation-value allocation-${bucket}`} key={bucket}>
                                <span><i aria-hidden="true" />{label}</span>
                                <strong><AnimatedPercentage value={value} /></strong>
                            </div>
                        ))}
                    </div>
                    <Slider.Root
                        className="allocation-slider"
                        value={boundaries}
                        onValueChange={changeAllocation}
                        min={0}
                        max={100}
                        step={5}
                        largeStep={10}
                        thumbCollisionBehavior="none"
                        disabled={!isEditingTargets || ratioStatus === 'saving'}
                    >
                        <Slider.Control
                            className="allocation-control"
                            onPointerDownCapture={event => {
                                touchGesture.current = event.pointerType === 'touch' || event.pointerType === 'pen'
                                    ? { x: event.clientX, y: event.clientY, axis: null }
                                    : null
                            }}
                            onKeyDownCapture={() => { touchGesture.current = null }}
                        >
                            <Slider.Track className="allocation-track">
                                <span className="allocation-segment allocation-needs" style={{ width: `${boundaries[0]}%` }} />
                                <span className="allocation-segment allocation-wants" style={{ width: `${boundaries[1] - boundaries[0]}%` }} />
                                <span className="allocation-segment allocation-savings" style={{ width: `${100 - boundaries[1]}%` }} />
                            </Slider.Track>
                            <Slider.Thumb
                                index={0}
                                className="allocation-thumb"
                                getAriaLabel={() => 'Needs and wants divider'}
                                getAriaValueText={() => `${needs}% needs, ${wants}% wants, ${savings}% savings`}
                            ><GripVertical aria-hidden="true" /></Slider.Thumb>
                            <Slider.Thumb
                                index={1}
                                className="allocation-thumb"
                                getAriaLabel={() => 'Wants and savings divider'}
                                getAriaValueText={() => `${needs}% needs, ${wants}% wants, ${savings}% savings`}
                            ><GripVertical aria-hidden="true" /></Slider.Thumb>
                        </Slider.Control>
                    </Slider.Root>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {isEditingTargets ? <>
                            <Button type="button" disabled={ratioStatus === 'saving' || !isRatioValid} onClick={() => { void persistRatios({ needs, wants, savings }) }}>
                                {ratioStatus === 'saving' ? 'Saving…' : 'Done'}
                            </Button>
                            <Button type="button" variant="outline" disabled={ratioStatus === 'saving'} onClick={() => {
                                ratioRevision.current += 1
                                setRatioDraft(null)
                                setRatioStatus('idle')
                                setIsEditingTargets(false)
                            }}>Cancel</Button>
                        </> : <Button type="button" variant="outline" disabled={ratioStatus === 'saving'} onClick={() => {
                            setRatioDraft(getRatios(settings))
                            setRatioStatus('idle')
                            setUndoRatios(null)
                            setIsEditingTargets(true)
                        }}>Edit targets</Button>}
                    </div>
                </div>
                <div className="ratio-save-status" aria-live="polite">
                    <span>{ratioStatus === 'saving' ? 'Saving…' : ratioStatus === 'saved' ? 'Saved' : ratioStatus === 'error' ? 'Couldn’t save targets. Try again.' : ''}</span>
                    {undoRatios && ratioStatus === 'saved' && <button type="button" className="settings-inline-action" onClick={() => { void persistRatios(undoRatios, false) }}>Undo</button>}
                </div>

                <form id="starting-balance-form" onSubmit={saveBalance}>
                    <div className="starting-balance grid gap-2">
                        <div className="flex items-center gap-1.5">
                            <Label htmlFor='startingSavingsBalanceInput'>Starting savings balance</Label>
                            <Popover>
                                <PopoverTrigger
                                    openOnHover
                                    delay={250}
                                    render={
                                        <button
                                            type="button"
                                            className="cursor-pointer text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            aria-label="About starting savings balance"
                                        />
                                    }
                                >
                                    <Info className="size-3.5" />
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-64 text-xs leading-relaxed text-muted-foreground"
                                    side="top"
                                    align="start"
                                    sideOffset={6}
                                >
                                    What you had before you began logging. This is the baseline for your savings balance.
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="balance-save-row">
                            <div className="relative min-w-0 flex-1">
                                <span
                                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
                                    aria-hidden="true"
                                >
                                    $
                                </span>
                                <Input
                                    className="h-10 pl-6 sm:h-8"
                                    type='number'
                                    inputMode="decimal"
                                    step='0.01'
                                    id="startingSavingsBalanceInput"
                                    name="startingSavingsBalance"
                                    value={balanceInput}
                                    onChange={event => { setBalanceDraft(event.target.value); setBalanceStatus('idle'); setBalanceError('') }}
                                    disabled={isLoading || balanceStatus === 'saving'}
                                    required
                                    aria-invalid={Boolean(balanceError)}
                                    aria-describedby={balanceError ? 'balance-save-error' : undefined}
                                    placeholder="0.00"
                                />
                            </div>
                            <Button type="submit" className="h-11 px-4" disabled={isLoading || balanceStatus === 'saving' || !balanceDirty}>
                                {balanceStatus === 'saving' ? 'Saving…' : balanceStatus === 'saved' ? <><Check aria-hidden="true" className="size-4" />Saved</> : 'Save'}
                            </Button>
                        </div>
                        {balanceError && <p id="balance-save-error" role="alert" className="text-xs text-destructive">{balanceError}</p>}
                    </div>

                </form>
                </>}
            </CardContent>
        </Card>
    )
}

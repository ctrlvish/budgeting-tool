import { useRef, useState } from 'react'
import { Slider } from '@base-ui/react/slider'
import { LockKeyhole, LockKeyholeOpen } from 'lucide-react'
import type { Bucket } from '@/types'
import { rebalanceAllocation, type Allocation } from '@/lib/budget-allocation'
import AnimatedPercentage from './animated-percentage'

const buckets: { id: Bucket, name: string }[] = [
    { id: 'needs', name: 'Needs' },
    { id: 'wants', name: 'Wants' },
    { id: 'savings', name: 'Savings' }
]

interface Props {
    values: Allocation
    onChange: (values: Allocation) => void
    holdOne: boolean
    disabled: boolean
}

export default function BudgetAllocationControl({ values, onChange, holdOne, disabled }: Props) {
    const [selected, setSelected] = useState<Bucket>('needs')
    const [locked, setLocked] = useState<Bucket>('savings')
    const basis = useRef(values)
    const selectedName = buckets.find(bucket => bucket.id === selected)!.name
    const lockedName = buckets.find(bucket => bucket.id === locked)!.name
    const maximum = 100 - (holdOne ? values[locked] : 0)

    function hold(bucket: Bucket) {
        setLocked(bucket)
        if (selected === bucket) setSelected(buckets.find(item => item.id !== bucket)!.id)
    }

    return (
        <div className="bucket-control">
            <div className="bucket-choices" role="group" aria-label="Choose a bucket to adjust">
                {buckets.map(bucket => {
                    const held = holdOne && locked === bucket.id
                    return (
                        <div className={`bucket-choice allocation-${bucket.id}`} key={bucket.id} data-selected={selected === bucket.id}>
                            <button type="button" className="bucket-select" disabled={disabled || held}
                                onClick={() => setSelected(bucket.id)} aria-pressed={selected === bucket.id}
                                aria-label={`Adjust ${bucket.name}, ${values[bucket.id]}%`}>
                                <span><i aria-hidden="true" />{bucket.name}</span>
                                <strong><AnimatedPercentage value={values[bucket.id]} /></strong>
                            </button>
                            {holdOne && <button type="button" className="bucket-lock" disabled={disabled}
                                aria-pressed={held} aria-label={`Hold ${bucket.name} steady`}
                                onClick={() => hold(bucket.id)}>
                                {held ? <LockKeyhole aria-hidden="true" /> : <LockKeyholeOpen aria-hidden="true" />}
                                <span>{held ? 'Held steady' : 'Hold steady'}</span>
                            </button>}
                        </div>
                    )
                })}
            </div>
            <div className="rebalance-flow" role="img" aria-label={`${values.needs}% needs, ${values.wants}% wants, ${values.savings}% savings`}>
                {buckets.map(bucket => <span key={bucket.id} className={`allocation-${bucket.id}`} style={{ width: `${values[bucket.id]}%` }} />)}
            </div>
            <div className="bucket-slider-heading"><span>Adjust {selectedName.toLowerCase()}</span><span>{holdOne ? `${lockedName} stays at ${values[locked]}%` : 'Other buckets share the change'}</span></div>
            {maximum > 0 ? <Slider.Root value={values[selected]} min={0} max={maximum} step={1} disabled={disabled}
                className={`single-bucket-slider allocation-${selected}`}
                onPointerDownCapture={() => { basis.current = values }}
                onFocusCapture={() => { basis.current = values }}
                onValueChange={value => onChange(rebalanceAllocation(basis.current, selected, value, holdOne ? locked : null))}>
                <Slider.Control className="single-bucket-track-control">
                    <Slider.Track className="single-bucket-track"><Slider.Indicator className="single-bucket-indicator" /></Slider.Track>
                    <Slider.Thumb className="single-bucket-thumb" getAriaLabel={() => `${selectedName} target`}
                        getAriaValueText={() => `${values.needs}% needs, ${values.wants}% wants, ${values.savings}% savings`} />
                </Slider.Control>
            </Slider.Root> : <p className="allocation-help">All income is held in {lockedName.toLowerCase()}. Hold a different bucket to make room to adjust.</p>}
            <p className="allocation-help">{holdOne
                ? `Choose a bucket, then drag. ${lockedName} stays fixed; the third bucket takes the difference.`
                : 'Choose a bucket, then drag. The other two keep roughly the same balance between them.'}
                <span>Arrow keys adjust by 1%. All three always add up to 100%.</span>
            </p>
        </div>
    )
}

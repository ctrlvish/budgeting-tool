import { useEffect } from 'react'
import { motion, useReducedMotion, useSpring, useTransform } from 'motion/react'

export default function AnimatedPercentage({ value }: { value: number }) {
    const reduceMotion = useReducedMotion()
    const display = useSpring(value, { stiffness: 500, damping: 40 })
    const formatted = useTransform(display, current => Math.round(current * 10) / 10)

    useEffect(() => {
        if (reduceMotion) display.jump(value)
        else display.set(value)
    }, [display, reduceMotion, value])

    return <><span className="sr-only">{value}%</span><span aria-hidden="true"><motion.span>{formatted}</motion.span><small>%</small></span></>
}

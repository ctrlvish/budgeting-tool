import { forwardRef, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'

interface PageTransitionProps {
    children : ReactNode
}

const PageTransition = forwardRef<HTMLDivElement, PageTransitionProps>(
    function PageTransition({ children }, ref) {
        const reduceMotion = useReducedMotion()
        return (
            <motion.div
                ref={ref}
                className="app-page-scroll absolute inset-0 overflow-y-auto bg-background pb-[calc(env(safe-area-inset-bottom)+5.5rem)] sm:pb-0"
                initial={reduceMotion ? false : { opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{
                    duration: reduceMotion ? 0 : 0.18,
                    ease: 'easeOut'
                }}
            >
                {children}
            </motion.div>
        )
    }
)

export default PageTransition

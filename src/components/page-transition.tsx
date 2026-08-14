import { forwardRef, type ReactNode } from 'react'
import { motion } from 'motion/react'

interface PageTransitionProps {
    children : ReactNode
}

const PageTransition = forwardRef<HTMLDivElement, PageTransitionProps>(
    function PageTransition({ children }, ref) {
        return (
            <motion.div
                ref={ref}
                className="absolute inset-0 overflow-y-auto bg-background"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                    duration: 0.15,
                    ease: 'easeOut'
                }}
            >
                {children}
            </motion.div>
        )
    }
)

export default PageTransition

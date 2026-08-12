import { forwardRef, type ReactNode } from 'react'
import { motion, useIsPresent } from 'motion/react'

const transitionDuration = 0.4

interface PageTransitionProps {
    children : ReactNode
    initialClipPath : string
}

const PageTransition = forwardRef<HTMLDivElement, PageTransitionProps>(
    function PageTransition({ children, initialClipPath }, ref) {
        const isPresent = useIsPresent()

        return (
            <motion.div
                ref={ref}
                className={`relative min-h-[calc(100dvh-3.5rem)] bg-background ${
                    isPresent
                        ? 'z-20'
                        : 'pointer-events-none z-10'
                }`}
                initial={{ clipPath: initialClipPath }}
                animate={{ clipPath: 'inset(0 0 0 0)' }}
                exit={{
                    opacity: 0,
                    transition: {
                        delay: transitionDuration,
                        duration: 0
                    }
                }}
                transition={{
                    clipPath: {
                        duration: transitionDuration,
                        ease: [0.22, 1, 0.36, 1]
                    }
                }}
                aria-hidden={!isPresent}
                inert={!isPresent}
            >
                {children}
            </motion.div>
        )
    }
)

export default PageTransition

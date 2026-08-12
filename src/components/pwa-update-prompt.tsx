import { useEffect } from 'react'
import { toast } from 'sonner'
import { useRegisterSW } from 'virtual:pwa-register/react'

const updateIntervalMs = 60 * 60 * 1000
const updateToastId = 'pwa-update'

let updateIntervalId : number | undefined

export default function PwaUpdatePrompt() {
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker
    } = useRegisterSW({
        onRegisteredSW(_swUrl, registration) {
            if (!registration) return

            if (updateIntervalId) {
                window.clearInterval(updateIntervalId)
            }

            updateIntervalId = window.setInterval(() => {
                void registration.update()
            }, updateIntervalMs)
        },
        onRegisterError(error) {
            console.error('failed to register service worker', error)
        }
    })

    useEffect(() => {
        if (!needRefresh) return

        toast('Update available', {
            id: updateToastId,
            duration: Infinity,
            action: {
                label: 'Update',
                onClick: () => {
                    void updateServiceWorker(true)
                }
            },
            cancel: {
                label: 'Later',
                onClick: () => setNeedRefresh(false)
            }
        })

        return () => {
            toast.dismiss(updateToastId)
        }
    }, [needRefresh, setNeedRefresh, updateServiceWorker])

    return null
}

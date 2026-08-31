import { useObservable } from 'dexie-react-hooks'
import { useState } from 'react'
import Dexie from 'dexie'
import { db } from '@/lib/db'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardAction
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

function getSyncDescription(
    isLoggedIn : boolean,
    phase : typeof db.cloud.syncState.value.phase | undefined
) {
    if (!isLoggedIn) return 'Your budget is stored on this device'

    if (!phase || phase === 'initial' || phase === 'not-in-sync') {
        return 'Checking cloud sync status…'
    }

    if (phase === 'pushing' || phase === 'pulling') {
        return 'Syncing your budget…'
    }

    if (phase === 'in-sync') {
        return 'Your budget is up to date across devices'
    }

    if (phase === 'offline') {
        return 'Offline — changes will sync when you reconnect'
    }

    return 'Cloud sync failed — your data is still stored on this device'
}

function isUserCancellation(error : unknown) {
    return error instanceof Dexie.AbortError
        || (error instanceof Error && error.message.includes('User cancelled'))
}

export default function AccountSettings() {
    const user = useObservable(db.cloud.currentUser)
    const syncState = useObservable(db.cloud.syncState)
    const [isLogoutOpen, setIsLogoutOpen] = useState(false)
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const [isLoggingIn, setIsLoggingIn] = useState(false)
    const [isSyncing, setIsSyncing] = useState(false)
    const isLoggedIn = Boolean(user?.isLoggedIn)
    const isSyncInProgress = isSyncing
        || syncState?.phase === 'pushing'
        || syncState?.phase === 'pulling'
    const syncDescription = getSyncDescription(isLoggedIn, syncState?.phase)

    async function handleLogout() {
        setIsLoggingOut(true)

        try {
            await db.cloud.logout()
            setIsLogoutOpen(false)
        } catch (error) {
            if (isUserCancellation(error)) return

            console.error('failed to log out', error)
            toast.error('Couldn’t log out')
        } finally {
            setIsLoggingOut(false)
        }
    }

    async function handleLogin() {
        setIsLoggingIn(true)

        try {
            await db.cloud.login()
            await db.cloud.sync({ wait: true, purpose: 'pull' })
        } catch (error) {
            if (isUserCancellation(error)) return

            console.error('failed to log in', error)
            toast.error('Couldn’t sign in')
        } finally {
            setIsLoggingIn(false)
        }
    }

    async function handleSync() {
        setIsSyncing(true)

        try {
            await db.cloud.sync({ wait: true, purpose: 'pull' })
            toast.success('Budget is up to date')
        } catch (error) {
            console.error('failed to sync budget', error)
            toast.error('Couldn’t sync budget. Your data is still on this device.')
        } finally {
            setIsSyncing(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription aria-live="polite">
                    {syncDescription}
                </CardDescription>
                <CardAction>
                    {isLoggedIn ? (
                        <Button
                            type="button"
                            variant="outline"
                            className="h-10 px-4 sm:h-8"
                            onClick={() => setIsLogoutOpen(true)}
                        >
                            Log out
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            variant="outline"
                            className="h-10 px-4 sm:h-8"
                            onClick={handleLogin}
                            disabled={isLoggingIn}
                        >
                            Sign in to sync
                        </Button>
                    )}
                </CardAction>
            </CardHeader>

            {isLoggedIn && (
                <CardContent className="flex flex-wrap items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-sm text-muted-foreground">
                        {user?.email ?? user?.userId}
                    </p>
                    <Button
                        type="button"
                        variant="secondary"
                        className="h-10 px-4 sm:h-8"
                        disabled={isSyncInProgress}
                        onClick={handleSync}
                    >
                        {isSyncInProgress ? 'Syncing…' : 'Sync now'}
                    </Button>
                </CardContent>
            )}
            <AlertDialog
                open={isLogoutOpen}
                onOpenChange={setIsLogoutOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Log out?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Synced data will be removed from this device. It will remain
                            in your account and return when you sign in again.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter className="bg-popover">
                        <AlertDialogCancel
                            disabled={isLoggingOut}
                        >Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                        >Log out
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    )
}

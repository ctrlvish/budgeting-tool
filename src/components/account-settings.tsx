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

function isUserCancellation(error : unknown) {
    return error instanceof Dexie.AbortError
        || (error instanceof Error && error.message.includes('User cancelled'))
}

export default function AccountSettings() {
    const user = useObservable(db.cloud.currentUser)
    const [isLogoutOpen, setIsLogoutOpen] = useState(false)
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const [isLoggingIn, setIsLoggingIn] = useState(false)

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
        } catch (error) {
            if (isUserCancellation(error)) return

            console.error('failed to log in', error)
            toast.error('Couldn’t sign in')
        } finally {
            setIsLoggingIn(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>
                    {user?.isLoggedIn
                        ? 'Your budget is synced across devices'
                        : 'Your budget is stored on this device'}
                </CardDescription>
                <CardAction>
                    {user?.isLoggedIn ? (
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

            {user?.isLoggedIn && (
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        {user.email ?? user.userId}
                    </p>
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

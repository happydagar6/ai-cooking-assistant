'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

export const ProfileSync = () => {
  const { user, isLoaded } = useUser()

  useEffect(() => {
    const syncProfile = async () => {
      if (!isLoaded || !user) return

      try {
        // Call our API route to create/update profile
        const response = await fetch('/api/profile/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            email: user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress,
            fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            avatarUrl: user.imageUrl,
          }),
        })

        if (response.ok) {
          // Profile synced successfully
        } else {
          console.error('Failed to sync profile:', await response.text())
        }
      } catch (error) {
        console.error('Error syncing profile:', error)
      }
    }

    syncProfile()
  }, [user, isLoaded])

  return null // This component doesn't render anything
}
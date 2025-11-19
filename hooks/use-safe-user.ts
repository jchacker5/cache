'use client'

import { useUser } from '@clerk/nextjs'
import { useContext } from 'react'

// Check if we're in a build environment or ClerkProvider is not available
function useSafeUser() {
  // Check if we're on the server (build time)
  if (typeof window === 'undefined') {
    return {
      user: null,
      isLoaded: false,
      isSignedIn: false,
    }
  }

  // Try to use Clerk's hook, but handle errors gracefully
  let userHook
  try {
    userHook = useUser()
  } catch (error) {
    // If ClerkProvider is not available, return safe defaults
    return {
      user: null,
      isLoaded: false,
      isSignedIn: false,
    }
  }

  return userHook
}

export { useSafeUser }


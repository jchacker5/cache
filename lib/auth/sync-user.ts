import { client } from '@/lib/convex/server'
import { api } from '@/convex/_generated/api'
import { User } from '@clerk/nextjs/server'

export async function syncUserWithConvex(clerkUser: User) {
  try {
    const userId = await client.mutation(api.users.syncUser, {
      clerkId: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      avatarUrl: clerkUser.imageUrl,
    })

    return userId
  } catch (error) {
    console.error('Error syncing user with Convex:', error)
    throw error
  }
}

// Keep the old function name for backward compatibility during migration
export async function syncUserWithSupabase(clerkUser: User) {
  return syncUserWithConvex(clerkUser)
}

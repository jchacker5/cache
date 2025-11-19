import { supabase } from '@/lib/supabase/client'
import { User } from '@clerk/nextjs/server'

export async function syncUserWithSupabase(clerkUser: User) {
  try {
    // Check if user already exists in Supabase
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUser.id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected for new users
      throw fetchError
    }

    if (existingUser) {
      // User already exists, update their profile
      const { error: updateError } = await supabase
        .from('users')
        .update({
          email: clerkUser.emailAddresses[0]?.emailAddress,
          first_name: clerkUser.firstName,
          last_name: clerkUser.lastName,
          avatar_url: clerkUser.imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('clerk_id', clerkUser.id)

      if (updateError) throw updateError

      return existingUser.id
    }

    // Create new user in Supabase
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        id: clerkUser.id,
        clerk_id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress,
        first_name: clerkUser.firstName,
        last_name: clerkUser.lastName,
        avatar_url: clerkUser.imageUrl,
      })
      .select('id')
      .single()

    if (insertError) throw insertError

    return newUser.id
  } catch (error) {
    console.error('Error syncing user with Supabase:', error)
    throw error
  }
}

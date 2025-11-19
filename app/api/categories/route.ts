import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()

    // Get user's categories
    const { data: userCategories, error: userError } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('name')

    if (userError) {
      console.error('Error fetching user categories:', userError)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    // If user has no categories, create default ones
    if (!userCategories || userCategories.length === 0) {
      // Get default categories
      const { data: defaultCategories, error: defaultError } = await supabase
        .from('default_categories')
        .select('*')
        .order('name')

      if (defaultError) {
        console.error('Error fetching default categories:', defaultError)
      } else if (defaultCategories) {
        // Create default categories for user
        const userDefaults = defaultCategories.map(cat => ({
          user_id: userId,
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          is_default: true,
        }))

        const { data: createdCategories, error: createError } = await supabase
          .from('categories')
          .insert(userDefaults)
          .select()
          .order('name')

        if (createError) {
          console.error('Error creating default categories:', createError)
          return NextResponse.json({ error: 'Failed to create categories' }, { status: 500 })
        }

        return NextResponse.json(createdCategories || [])
      }
    }

    return NextResponse.json(userCategories || [])
  } catch (error) {
    console.error('Categories API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/convex/server'
import { api } from '@/convex/_generated/api'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const categories = await client.query(api.categories.list, { userId })

    return NextResponse.json(categories || [])
  } catch (error) {
    console.error('Categories API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { headers, cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const headersList = await headers()
  const cookieStore = await cookies()

  const userId = headersList.get('x-user-id')
  const userEmail = headersList.get('x-user-email')

  // Collect all cookies (names only for security)
  const cookieNames = cookieStore.getAll().map(c => c.name)

  return NextResponse.json({
    headers: {
      'x-user-id': userId,
      'x-user-email': userEmail,
    },
    cookieNames,
    hasUser: !!userId,
  })
}

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Only the landing page and public reports are public — everything else requires auth
const isPublicRoute = createRouteMatcher(['/', '/report/(.*)', '/api/sessions/(.*)/report'])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    const { userId } = await auth()

    if (!userId) {
      // Redirect unauthenticated users to landing with a notice
      const landingUrl = new URL('/', req.url)
      landingUrl.searchParams.set('auth', 'required')
      return NextResponse.redirect(landingUrl)
    }
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}

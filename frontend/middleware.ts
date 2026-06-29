declare const process: {
  env: {
    WORKER_SECRET?: string;
    VERCEL_ENV?: string;
    VITE_API_BASE_URL?: string;
  };
};

function formatLocalDateTime(utcIso: string): string {
  try {
    return new Intl.DateTimeFormat('cs-CZ', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Europe/Prague',
    }).format(new Date(utcIso))
  } catch {
    return utcIso
  }
}

export default async function middleware(request: Request) {
  const url = new URL(request.url)

  // Enforce the worker secret in deployed preview or production environments
  const expectedSecret = process.env.WORKER_SECRET
  if (expectedSecret && process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'development') {
    const secret = request.headers.get('x-worker-secret')
    if (secret !== expectedSecret) {
      return new Response('Forbidden', { status: 403 })
    }
  }

  // Intercept invite ingress routes for crawlers/previews (or all visitors) to serve dynamic OG tags
  const inviteMatch = url.pathname.match(/^\/i\/([^/]+)/)
  if (inviteMatch) {
    const inviteToken = inviteMatch[1]
    
    // Resolve API base URL: environment variable, local fallback, or request origin
    let apiBaseUrl = process.env.VITE_API_BASE_URL
    if (!apiBaseUrl) {
      const origin = url.origin
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        apiBaseUrl = 'http://localhost:8000'
      } else {
        apiBaseUrl = origin
      }
    }
    apiBaseUrl = apiBaseUrl.replace(/\/$/, '')

    try {
      const resolveRes = await fetch(`${apiBaseUrl}/invitations/${inviteToken}/resolve`)
      if (resolveRes.ok) {
        const data = await resolveRes.json()
        const { ride_id, destination, departure_time, driver_name, car_name } = data

        if (ride_id) {
          const indexRes = await fetch(new URL('/index.html', request.url))
          if (indexRes.ok) {
            let html = await indexRes.text()
            const departureTimeFormatted = departure_time ? formatLocalDateTime(departure_time) : ''
            const driverInfo = driver_name ? ` (Řidič: ${driver_name}${car_name ? ` - ${car_name}` : ''})` : ''
            const description = `Přidej se k naší spolujízdě! Cíl: ${destination || ''}. Odjezd: ${departureTimeFormatted}.${driverInfo}`

            html = html
              .replace(/<title>Sitzy<\/title>/, `<title>Sitzy — Spolujízda ${destination ? `do ${destination}` : ''}</title>`)
              .replace(
                /<meta property="og:title" content="[^"]*"\s*\/?>/g,
                `<meta property="og:title" content="Sitzy — Spolujízda ${destination ? `do ${destination}` : ''}" />`
              )
              .replace(
                /<meta property="og:description" content="[^"]*"\s*\/?>/g,
                `<meta property="og:description" content="${description}" />`
              )
              .replace(
                /<meta property="og:image" content="[^"]*"\s*\/?>/g,
                `<meta property="og:image" content="${apiBaseUrl}/rides/og/${ride_id}" />`
              )
              .replace(
                /<meta name="twitter:title" content="[^"]*"\s*\/?>/g,
                `<meta name="twitter:title" content="Sitzy — Spolujízda ${destination ? `do ${destination}` : ''}" />`
              )
              .replace(
                /<meta name="twitter:description" content="[^"]*"\s*\/?>/g,
                `<meta name="twitter:description" content="${description}" />`
              )
              .replace(
                /<meta name="twitter:image" content="[^"]*"\s*\/?>/g,
                `<meta name="twitter:image" content="${apiBaseUrl}/rides/og/${ride_id}" />`
              )

            return new Response(html, {
              headers: {
                'content-type': 'text/html; charset=utf-8',
              },
            })
          }
        }
      }
    } catch (e) {
      console.error('Failed to resolve invite in middleware:', e)
    }
  }
}

export const config = {
  matcher: '/:path*',
}

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
    // Bypass secret check for static files (images, stylesheets, scripts, manifests, fonts)
    const isStaticFile = /\.(png|jpg|jpeg|gif|svg|ico|webp|css|js|webmanifest|woff2?|ttf|eot)$/i.test(url.pathname)
    if (!isStaticFile) {
      const secret = request.headers.get('x-worker-secret')
      if (secret !== expectedSecret) {
        return new Response('Forbidden', { status: 403 })
      }
    }
  }

  const normalizedPathname = url.pathname.replace(/\/$/, '') || '/'

  // Intercept survey route to serve custom static OG tags
  if (normalizedPathname === '/survey') {
    try {
      const headers = new Headers()
      const secret = request.headers.get('x-worker-secret')
      if (secret) {
        headers.set('x-worker-secret', secret)
      }
      const indexRes = await fetch(new URL('/index.html', request.url), { headers })
      if (indexRes.ok) {
        let html = await indexRes.text()
        const title = 'Uživatelský průzkum — Sitzy'
        const description = 'Pomoz nám otestovat Sitzy! Průzkum je zcela anonymní, proto tě na konci poprosíme o smazání účtu (tím vymažeš všechna data a přejdeš na dotazník). Víme, že je to docela dost klikání, ale moc nám to pomůže! 🙌'
        const imageUrl = `${url.origin}/OG_survey.png`

        html = html
          .replace(/<title>Sitzy<\/title>/, `<title>${title}</title>`)
          .replace(
            /<meta property="og:url" content="[^"]*"\s*\/?>/g,
            `<meta property="og:url" content="${url.origin}/survey" />`
          )
          .replace(
            /<meta property="og:title" content="[^"]*"\s*\/?>/g,
            `<meta property="og:title" content="${title}" />`
          )
          .replace(
            /<meta property="og:description" content="[^"]*"\s*\/?>/g,
            `<meta property="og:description" content="${description}" />`
          )
          .replace(
            /<meta property="og:image" content="[^"]*"\s*\/?>/g,
            `<meta property="og:image" content="${imageUrl}" />`
          )
          .replace(
            /<meta name="twitter:title" content="[^"]*"\s*\/?>/g,
            `<meta name="twitter:title" content="${title}" />`
          )
          .replace(
            /<meta name="twitter:description" content="[^"]*"\s*\/?>/g,
            `<meta name="twitter:description" content="${description}" />`
          )
          .replace(
            /<meta name="twitter:image" content="[^"]*"\s*\/?>/g,
            `<meta name="twitter:image" content="${imageUrl}" />`
          )
          .replace(
            /<meta itemprop="name" content="[^"]*"\s*\/?>/g,
            `<meta itemprop="name" content="${title}" />`
          )
          .replace(
            /<meta itemprop="description" content="[^"]*"\s*\/?>/g,
            `<meta itemprop="description" content="${description}" />`
          )
          .replace(
            /<meta itemprop="image" content="[^"]*"\s*\/?>/g,
            `<meta itemprop="image" content="${imageUrl}" />`
          )

        return new Response(html, {
          headers: {
            'content-type': 'text/html; charset=utf-8',
          },
        })
      }
    } catch (e) {
      console.error('Failed to serve survey OG tags in middleware:', e)
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
          const headers = new Headers()
          const secret = request.headers.get('x-worker-secret')
          if (secret) {
            headers.set('x-worker-secret', secret)
          }
          const indexRes = await fetch(new URL('/index.html', request.url), { headers })
          if (indexRes.ok) {
            let html = await indexRes.text()
            const departureTimeFormatted = departure_time ? formatLocalDateTime(departure_time) : ''
            const driverInfo = driver_name ? ` (Řidič: ${driver_name}${car_name ? ` - ${car_name}` : ''})` : ''
            const description = `Přidej se k naší spolujízdě! Cíl: ${destination || ''}. Odjezd: ${departureTimeFormatted}.${driverInfo}`

            const imageQuery = url.search ? url.search : `?t=${Date.now()}`

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
                `<meta property="og:image" content="${apiBaseUrl}/rides/og/${ride_id}${imageQuery}" />`
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
                `<meta name="twitter:image" content="${apiBaseUrl}/rides/og/${ride_id}${imageQuery}" />`
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

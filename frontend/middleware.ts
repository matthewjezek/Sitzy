declare const process: {
  env: {
    WORKER_SECRET?: string;
    VERCEL_ENV?: string;
  };
};

export default function middleware(request: Request) {
  const expectedSecret = process.env.WORKER_SECRET;

  // Only enforce the worker secret in deployed preview or production environments
  if (expectedSecret && process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'development') {
    const secret = request.headers.get('x-worker-secret');
    if (secret !== expectedSecret) {
      return new Response('Forbidden', { status: 403 });
    }
  }
}

export const config = {
  matcher: '/:path*',
};

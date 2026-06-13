declare const process: {
  env: {
    WORKER_SECRET?: string;
  };
};

export default function middleware(request: Request) {
  const expectedSecret = process.env.WORKER_SECRET;

  // Only enforce the worker secret if it is configured in the environment variables
  if (expectedSecret) {
    const secret = request.headers.get('x-worker-secret');
    if (secret !== expectedSecret) {
      return new Response('Forbidden', { status: 403 });
    }
  }
}

export const config = {
  matcher: '/:path*',
};

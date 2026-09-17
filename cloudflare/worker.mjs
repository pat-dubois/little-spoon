import { createHash, timingSafeEqual } from 'node:crypto';

const headers = {
  'Cache-Control': 'private, no-store',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'X-Content-Type-Options': 'nosniff',
};

export default {
  async fetch(request, env) {
    // Never serve the calculator if its secret has not been provisioned.
    if (!env.PASSWORD) {
      return new Response('Little Spoon is being set up. Please try again later.', {
        status: 503, headers,
      });
    }
    const authorization = request.headers.get('Authorization') || '';
    const match = /^Basic ([A-Za-z0-9+/]+={0,2})$/i.exec(authorization);
    const supplied = match ? Buffer.from(match[1], 'base64') : Buffer.alloc(0);
    const expected = Buffer.from(`Crystal:${env.PASSWORD}`, 'utf8');
    const digest = value => createHash('sha256').update(value).digest();
    if (!match || !timingSafeEqual(digest(supplied), digest(expected))) {
      return new Response('Please sign in to Little Spoon.', {
        status: 401,
        headers: { ...headers, 'WWW-Authenticate': 'Basic realm="Little Spoon", charset="UTF-8"' },
      });
    }
    // The asset binding receives no login credentials.
    const assetRequest = new Request(request);
    assetRequest.headers.delete('Authorization');
    const asset = await env.ASSETS.fetch(assetRequest);
    const response = new Response(asset.body, asset);
    for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
    return response;
  },
};

import { tools } from '../../data/tools.js';

export const prerender = true;

// Static tool registry for the site-search index. SearchModal fetches this
// once on first search use instead of embedding ~27KB of JSON in every
// page's HTML. Always in sync — built from the same source as the pages.
export async function GET() {
  return new Response(JSON.stringify(tools), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

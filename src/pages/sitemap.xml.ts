import type { APIRoute } from 'astro';

const SITE_URL = 'https://saoudi.online';

const PAGES = [
	{ path: '', priority: '1.0', changefreq: 'weekly' },
	{ path: 'projects', priority: '0.9', changefreq: 'weekly' },
	{ path: 'experience', priority: '0.9', changefreq: 'monthly' },
	{ path: 'designs', priority: '0.8', changefreq: 'monthly' },
	{ path: 'certifications', priority: '0.8', changefreq: 'monthly' },
	{ path: 'services', priority: '0.8', changefreq: 'monthly' },
	{ path: 'resume', priority: '0.7', changefreq: 'monthly' },
];

export const GET: APIRoute = async () => {
	const lastMod = new Date().toISOString().split('T')[0];

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES.map(
	(page) => `  <url>
    <loc>${SITE_URL}${page.path ? `/${page.path}` : ''}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
).join('\n')}
</urlset>`;

	return new Response(xml, {
		status: 200,
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
			'X-Content-Type-Options': 'nosniff',
		},
	});
};

const DEFAULT_SITE_URL = "https://noor-elhayaa-physical-therapy.vercel.app";
const STATIC_ROUTES = [
  { path: "", changefreq: "daily", priority: "1.0" },
  { path: "articles", changefreq: "daily", priority: "0.9" },
  { path: "booking", changefreq: "weekly", priority: "0.8" },
];

const siteUrl = (Deno.env.get("SITE_URL") ?? DEFAULT_SITE_URL).trim().replace(/\/+$/, "");
const supabaseUrl = (Deno.env.get("SUPABASE_URL") ?? "").trim().replace(/\/+$/, "");
const supabaseAnonKey = (Deno.env.get("SUPABASE_ANON_KEY") ?? "").trim();

const xmlHeaders = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=300",
};

const escapeXml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const buildUrl = (routePath = "") => {
  const normalizedPath = routePath.replace(/^\/+/, "");
  return new URL(normalizedPath, `${siteUrl}/`).toString();
};

const fetchRows = async (table: string, query: string) => {
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${table}: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

const serializeSitemap = (
  entries: Array<{ loc: string; lastmod?: string; changefreq?: string; priority?: string }>,
) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(({ loc, lastmod, changefreq, priority }) => `  <url>
    <loc>${escapeXml(loc)}</loc>
${lastmod ? `    <lastmod>${escapeXml(lastmod)}</lastmod>\n` : ""}${changefreq ? `    <changefreq>${changefreq}</changefreq>\n` : ""}${priority ? `    <priority>${priority}</priority>\n` : ""}  </url>`)
  .join("\n")}
</urlset>
`;

Deno.serve(async (request) => {
  if (request.method !== "GET") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: xmlHeaders,
    });
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response("Supabase environment variables are missing.", {
      status: 500,
      headers: xmlHeaders,
    });
  }

  const entries = STATIC_ROUTES.map((route) => ({
    loc: buildUrl(route.path),
    changefreq: route.changefreq,
    priority: route.priority,
  }));

  try {
    const [articles, offers] = await Promise.all([
      fetchRows("articles", "select=slug,updated_at&published=eq.true&order=updated_at.desc"),
      fetchRows("offers", "select=slug,updated_at&active=eq.true&slug=not.is.null&order=updated_at.desc"),
    ]);

    entries.push(
      ...articles
        .filter((article: { slug?: string }) => article.slug)
        .map((article: { slug: string; updated_at?: string }) => ({
          loc: buildUrl(`articles/${article.slug}`),
          lastmod: article.updated_at,
          changefreq: "weekly",
          priority: "0.8",
        })),
    );

    entries.push(
      ...offers
        .filter((offer: { slug?: string }) => offer.slug)
        .map((offer: { slug: string; updated_at?: string }) => ({
          loc: buildUrl(`offers/${offer.slug}`),
          lastmod: offer.updated_at,
          changefreq: "weekly",
          priority: "0.7",
        })),
    );
  } catch (error) {
    console.error("[sitemap] Failed to fetch dynamic URLs:", error);
  }

  return new Response(serializeSitemap(entries), {
    status: 200,
    headers: xmlHeaders,
  });
});

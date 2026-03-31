import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const publicDir = path.join(projectRoot, "public");
const envFile = path.join(projectRoot, ".env");

const DEFAULT_SITE_URL = "https://noor-elhayaa-physical-therapy.vercel.app";
const STATIC_ROUTES = [
  { path: "", changefreq: "daily", priority: "1.0" },
  { path: "articles", changefreq: "daily", priority: "0.9" },
  { path: "booking", changefreq: "weekly", priority: "0.8" },
];

const normalizeUrl = (value) => (value || DEFAULT_SITE_URL).trim().replace(/\/+$/, "");
const siteUrl = normalizeUrl(process.env.VITE_SITE_URL);

const escapeXml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const buildUrl = (routePath = "") => {
  const normalizedPath = routePath.replace(/^\/+/, "");
  return new URL(normalizedPath, `${siteUrl}/`).toString();
};

const parseEnvFile = async () => {
  try {
    const raw = await fs.readFile(envFile, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const equalsIndex = trimmed.indexOf("=");
      if (equalsIndex === -1) continue;
      const key = trimmed.slice(0, equalsIndex).trim();
      const value = trimmed.slice(equalsIndex + 1).trim().replace(/^"(.*)"$/, "$1");
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch {
    // No local env file is fine when CI injects env vars.
  }
};

const fetchRows = async (table, query) => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !anonKey) {
    return [];
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${table}: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

const serializeSitemap = (entries) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(({ loc, lastmod, changefreq, priority }) => `  <url>
    <loc>${escapeXml(loc)}</loc>
${lastmod ? `    <lastmod>${escapeXml(lastmod)}</lastmod>\n` : ""}${changefreq ? `    <changefreq>${changefreq}</changefreq>\n` : ""}${priority ? `    <priority>${priority}</priority>\n` : ""}  </url>`)
  .join("\n")}
</urlset>
`;

await parseEnvFile();

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
      .filter((article) => article.slug)
      .map((article) => ({
        loc: buildUrl(`articles/${article.slug}`),
        lastmod: article.updated_at,
        changefreq: "weekly",
        priority: "0.8",
      })),
  );

  entries.push(
    ...offers
      .filter((offer) => offer.slug)
      .map((offer) => ({
        loc: buildUrl(`offers/${offer.slug}`),
        lastmod: offer.updated_at,
        changefreq: "weekly",
        priority: "0.7",
      })),
  );
} catch (error) {
  console.warn("[sitemap] Dynamic fetch skipped:", error instanceof Error ? error.message : error);
}

await fs.mkdir(publicDir, { recursive: true });
await fs.writeFile(path.join(publicDir, "sitemap.xml"), serializeSitemap(entries), "utf8");

console.log(`[sitemap] Generated ${entries.length} URLs into public/sitemap.xml`);

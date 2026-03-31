const DEFAULT_SITE_URL = "https://noor-elhayaa-physical-therapy.vercel.app";

const normalizeSiteUrl = (value?: string | null) =>
  (value || DEFAULT_SITE_URL).trim().replace(/\/+$/, "");

export const SITE_URL = normalizeSiteUrl(import.meta.env.VITE_SITE_URL);

export const canonicalFromSlug = (slug = "") => {
  const normalizedSlug = slug.replace(/^\/+/, "");
  return new URL(normalizedSlug, `${SITE_URL}/`).toString();
};

export const toAbsoluteUrl = (value?: string | null) => {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return new URL(value.startsWith("/") ? value : `/${value}`, `${SITE_URL}/`).toString();
};

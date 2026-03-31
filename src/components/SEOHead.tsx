import { Helmet } from "react-helmet-async";
import { useLanguage } from "@/i18n/LanguageContext";
import { canonicalFromSlug, toAbsoluteUrl } from "@/lib/seo";

interface SEOHeadProps {
  title: string;
  description: string;
  slug?: string;
  image?: string;
  type?: string;
  keywords?: string | string[];
  noIndex?: boolean;
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>>;
}

const SEOHead = ({
  title,
  description,
  slug,
  image,
  type = "website",
  keywords,
  noIndex = false,
  structuredData,
}: SEOHeadProps) => {
  const { language } = useLanguage();
  const fullTitle = `${title} | مركز نور الحياة - Noor Al-Hayat`;
  const canonicalUrl = typeof slug === "string" ? canonicalFromSlug(slug) : undefined;
  const imageUrl = toAbsoluteUrl(image) ?? canonicalFromSlug("og.png");
  const keywordsContent = Array.isArray(keywords) ? keywords.join(", ") : keywords;

  return (
    <Helmet>
      <html lang={language} dir={language === "ar" ? "rtl" : "ltr"} />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta
        name="robots"
        content={
          noIndex
            ? "noindex, nofollow"
            : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        }
      />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={imageUrl} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:site_name" content="Noor Al-Hayat" />
      <meta property="og:locale" content={language === "ar" ? "ar_EG" : "en_US"} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      <meta
        name="keywords"
        content={
          keywordsContent ||
          "مركز نور الحياة, Noor Al-Hayat, علاج طبيعي, تغذية علاجية, Physiotherapy, Clinical Nutrition"
        }
      />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta
        name="author"
        content="مركز نور الحياة - د. أحمد يحيى شحاتة - د. يارا محمد علي"
      />
      {structuredData && (
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      )}
    </Helmet>
  );
};

export default SEOHead;

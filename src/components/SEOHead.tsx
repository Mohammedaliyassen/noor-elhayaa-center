import { Helmet } from "react-helmet-async";
import { useLanguage } from "@/i18n/LanguageContext";

interface SEOHeadProps {
  title: string;
  description: string;
  slug?: string;
  image?: string;
  type?: string;
}

const SEOHead = ({
  title,
  description,
  slug = "",
  image,
  type = "website",
}: SEOHeadProps) => {
  const { language } = useLanguage();
  const fullTitle = `${title} | مركز نور الحياة - Noor Al-Hayat`;

  return (
    <Helmet>
      <html lang={language} dir={language === "ar" ? "rtl" : "ltr"} />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      {image && <meta property="og:image" content={image} />}
      {slug && (
        // TODO: ده لازم يتغير بالدومين الاصلي لما يبقي موجود ان شاء الله
        <link rel="canonical" href={`https://noor-alhayat.com/${slug}`} />
      )}
      <meta
        name="keywords"
        content="مركز نور الحياة, علاج طبيعي, تغذية علاجية, تخسيس, تأهيل حركي, دكتور علاج طبيعي, مركز علاج طبيعي"
      />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
      <meta
        name="author"
        content="مركز نور الحياة - د. أحمد يحي شحاتة- د. يارا محمد علي"
      />
    </Helmet>
  );
};

export default SEOHead;

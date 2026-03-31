import MainLayout from "@/components/layout/MainLayout";
import HeroSection from "@/components/landing/HeroSection";
import AboutSection from "@/components/landing/AboutSection";
import ServicesSection from "@/components/landing/ServicesSection";
import LatestArticlesSection from "@/components/landing/LatestArticlesSection";
import OffersSection from "@/components/landing/OffersSection";
import CTASection from "@/components/landing/CTASection";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/i18n/LanguageContext";
import { canonicalFromSlug, toAbsoluteUrl } from "@/lib/seo";

const Index = () => {
  const { isRTL } = useLanguage();
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    name: "مركز نور الحياة - Noor Al-Hayat",
    url: canonicalFromSlug(""),
    logo: toAbsoluteUrl("/imgs/logo.jpg"),
    image: toAbsoluteUrl("/og.png"),
    availableLanguage: ["ar", "en"],
    medicalSpecialty: ["Physiotherapy", "Clinical Nutrition"],
  };

  return (
    <MainLayout>
      <SEOHead
        title={
          isRTL
            ? "مركز نور الحياة للعلاج الطبيعي والتغذية العلاجية"
            : "Physiotherapy & Clinical Nutrition Center"
        }
        description={
          isRTL
            ? "مركز نور الحياة يقدم العلاج الطبيعي والتغذية العلاجية وبرامج التأهيل والحجز الطبي بسهولة."
            : "Noor Al-Hayat offers physiotherapy, rehabilitation, and clinical nutrition services with easy online booking."
        }
        slug=""
        image="/imgs/logo.jpg"
        type="website"
        keywords={[
          "مركز علاج طبيعي",
          "علاج طبيعي",
          "تغذية علاجية",
          "Physiotherapy",
          "Clinical Nutrition",
          "Noor Al-Hayat",
        ]}
        structuredData={organizationSchema}
      />
      <HeroSection />
      <AboutSection />
      <ServicesSection />
      <LatestArticlesSection />
      <OffersSection />
      <CTASection />
    </MainLayout>
  );
};

export default Index;

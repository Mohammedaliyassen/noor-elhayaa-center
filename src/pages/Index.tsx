import MainLayout from "@/components/layout/MainLayout";
import HeroSection from "@/components/landing/HeroSection";
import AboutSection from "@/components/landing/AboutSection";
import ServicesSection from "@/components/landing/ServicesSection";
import LatestArticlesSection from "@/components/landing/LatestArticlesSection";
import OffersSection from "@/components/landing/OffersSection";
import CTASection from "@/components/landing/CTASection";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/i18n/LanguageContext";

const Index = () => {
  const { isRTL } = useLanguage();

  return (
    <MainLayout>
      <SEOHead
        title={isRTL ? "الصفحة الرئيسية" : "Home"}
        description={
          isRTL
            ? "مركز نور الحياة الطبي - خبرة متخصصة في العلاج الطبيعي والتغذية العلاجية"
            : "Noor Al-Hayat Medical Center - Expert Physiotherapy & Clinical Nutrition"
        }
        image="/public/imgs/logo.jpg"
        type="website"
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

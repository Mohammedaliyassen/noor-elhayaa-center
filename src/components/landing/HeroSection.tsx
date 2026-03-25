import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Calendar } from "lucide-react";
import { motion } from "framer-motion";

const HeroSection = () => {
  const { t, isRTL } = useLanguage();
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <section className="relative overflow-hidden bg-gradient-hero py-20 md:py-32">
      {/* Decorative blobs */}
      <div className="absolute -top-20 end-0 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-0 start-0 h-56 w-56 rounded-full bg-secondary/5 blur-3xl" />

      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <Calendar className="h-4 w-4" />
            {isRTL ? "الحجز متاح الآن" : "Booking Now Available"}
          </div>

          <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
            <span className="text-gradient-medical">{t("hero.title")}</span>
          </h1>

          <p className="mb-8 text-2xl text-muted-foreground md:text-2xl text-bold">
            {t("hero.subtitle2")}
          </p>
          <p className="mb-8 text-xl text-muted-foreground md:text-lg">
            {t("hero.subtitle")}
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="bg-gradient-medical px-8 text-base hover:opacity-90"
            >
              <Link to="/booking">
                {t("hero.cta")}
                <Arrow className="ms-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base">
              <a href="#about">{t("hero.learn")}</a>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;

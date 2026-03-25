import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Tag, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback } from "react";

interface Offer {
  id: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  image: string | null;
  discount_percentage: number | null;
  slug: string | null;
}

const OffersSection = () => {
  const { t, language, isRTL } = useLanguage();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, direction: isRTL ? "rtl" : "ltr" });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const { data: offers, isLoading } = useQuery({
    queryKey: ["public-offers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("id, title_ar, title_en, description_ar, description_en, image, discount_percentage, slug")
        .eq("active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Offer[];
    },
  });

  if (isLoading) {
    return (
      <section className="bg-muted/50 py-20">
        <div className="container flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (!offers?.length) return null;

  return (
    <section className="bg-muted/50 py-20">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="mb-3 text-3xl font-bold md:text-4xl">{t("offers.title")}</h2>
          <p className="text-muted-foreground">{t("offers.subtitle")}</p>
        </motion.div>

        <div className="relative mx-auto max-w-5xl">
          {/* Navigation buttons */}
          <Button
            variant="outline"
            size="icon"
            className="absolute -left-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full shadow-md md:flex"
            onClick={scrollPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute -right-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full shadow-md md:flex"
            onClick={scrollNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-4">
              {offers.map((offer, i) => {
                const offerLink = offer.slug ? `/offers/${offer.slug}` : "/booking";
                return (
                  <motion.div
                    key={offer.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="min-w-0 flex-[0_0_100%] md:flex-[0_0_48%]"
                  >
                    <Link to={offerLink}>
                      <Card className="group overflow-hidden border-0 shadow-sm transition-shadow hover:shadow-medical">
                        {offer.image && (
                          <div className="aspect-video overflow-hidden bg-muted">
                            <img
                              src={offer.image}
                              alt={language === "ar" ? offer.title_ar : offer.title_en}
                              className="h-full w-full object-cover transition-transform group-hover:scale-105"
                              loading="lazy"
                            />
                          </div>
                        )}
                        <CardContent className="p-5">
                          {offer.discount_percentage && (
                            <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-semibold text-secondary">
                              <Tag className="h-3 w-3" />
                              {offer.discount_percentage === 100
                                ? language === "ar" ? "مجاني" : "Free"
                                : `${offer.discount_percentage}% ${language === "ar" ? "خصم" : "Off"}`}
                            </span>
                          )}
                          <h3 className="mb-2 text-lg font-bold">
                            {language === "ar" ? offer.title_ar : offer.title_en}
                          </h3>
                          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                            {language === "ar" ? offer.description_ar : offer.description_en}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OffersSection;

import { useParams, Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import MainLayout from "@/components/layout/MainLayout";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Calendar, Tag, Gift } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const OfferPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language, isRTL } = useLanguage();
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  const { data: offer, isLoading } = useQuery({
    queryKey: ["offer", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("*")
        .eq("slug", slug)
        .eq("active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: otherOffers } = useQuery({
    queryKey: ["other-offers", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("id, title_ar, title_en, image, slug, discount_percentage")
        .eq("active", true)
        .neq("slug", slug!)
        .order("created_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container max-w-3xl py-12">
          <Skeleton className="mb-6 h-8 w-32" />
          <Skeleton className="mb-6 aspect-video w-full rounded-xl" />
          <Skeleton className="mb-4 h-10 w-3/4" />
          <Skeleton className="mb-8 h-4 w-1/2" />
        </div>
      </MainLayout>
    );
  }

  if (!offer) {
    return (
      <MainLayout>
        <div className="container py-20 text-center">
          <h1 className="mb-4 text-2xl font-bold">{isRTL ? "العرض غير موجود" : "Offer Not Found"}</h1>
          <Button asChild variant="outline">
            <Link to="/">{isRTL ? "العودة للرئيسية" : "Back to Home"}</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  const title = language === "ar" ? offer.title_ar : offer.title_en;
  const description = language === "ar" ? offer.description_ar : offer.description_en;
  const bookingUrl = offer.coupon_code
    ? `/booking?coupon=${encodeURIComponent(offer.coupon_code)}&discount=${offer.discount_percentage || 0}`
    : "/booking";

  return (
    <MainLayout>
      <SEOHead
        title={title}
        description={description}
        slug={`offers/${offer.slug}`}
        image={offer.image ?? "/og.png"}
        keywords={["عروض", "offer", "physiotherapy offer", "nutrition offer"]}
      />

      <article className="py-12">
        <div className="container max-w-3xl">
          <Button asChild variant="ghost" className="mb-6">
            <Link to="/">
              <BackArrow className="me-2 h-4 w-4" />
              {isRTL ? "العودة" : "Back"}
            </Link>
          </Button>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {offer.image && (
              <div className="mb-6 aspect-video overflow-hidden rounded-xl bg-muted">
                <img src={offer.image} alt={title} className="h-full w-full object-cover" />
              </div>
            )}

            <div className="mb-4 flex flex-wrap items-center gap-3">
              {offer.discount_percentage && (
                <Badge className="bg-secondary text-secondary-foreground">
                  <Tag className="me-1 h-3 w-3" />
                  {offer.discount_percentage === 100
                    ? (isRTL ? "مجاني" : "Free")
                    : `${offer.discount_percentage}% ${isRTL ? "خصم" : "Off"}`}
                </Badge>
              )}
              {offer.coupon_code && (
                <Badge variant="outline" className="font-mono">
                  {offer.coupon_code}
                </Badge>
              )}
            </div>

            <h1 className="mb-4 text-3xl font-bold leading-tight md:text-4xl">{title}</h1>

            <div className="mb-8 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {isRTL ? "صالح حتى" : "Valid until"}: {new Date(offer.valid_until).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US")}
              </span>
            </div>

            <div className="prose prose-lg max-w-none whitespace-pre-line leading-relaxed text-foreground">
              {description}
            </div>

            <div className="mt-10">
              <Button asChild size="lg" className="w-full bg-gradient-medical text-lg hover:opacity-90 sm:w-auto">
                <Link to={bookingUrl}>
                  <Gift className="me-2 h-5 w-5" />
                  {isRTL ? "استفد بالعرض الآن" : "Claim This Offer"}
                </Link>
              </Button>
            </div>
          </motion.div>

          {otherOffers && otherOffers.length > 0 && (
            <div className="mt-12 border-t border-border pt-8">
              <h2 className="mb-6 text-xl font-bold">{isRTL ? "عروض أخرى" : "Other Offers"}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {otherOffers.map((o) => (
                  <Link key={o.id} to={`/offers/${o.slug}`}>
                    <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-medical">
                      {o.image && (
                        <div className="aspect-video overflow-hidden bg-muted">
                          <img
                            src={o.image}
                            alt={language === "ar" ? o.title_ar : o.title_en}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <CardContent className="p-4">
                        <h3 className="font-bold">{language === "ar" ? o.title_ar : o.title_en}</h3>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>
    </MainLayout>
  );
};

export default OfferPage;

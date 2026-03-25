import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useArticles } from "@/hooks/useArticles";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { articleCategories } from "@/data/mockData";

const LatestArticlesSection = () => {
  const { t, language, isRTL } = useLanguage();
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  const { data: articles, isLoading } = useArticles({ limit: 3 });

  if (isLoading) {
    return (
      <section className="py-20">
        <div className="container">
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-video w-full" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!articles?.length) return null;

  return (
    <section className="py-20">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 flex flex-col items-center justify-between gap-4 sm:flex-row"
        >
          <div>
            <h2 className="mb-1 text-3xl font-bold md:text-4xl">{t("articles.latest")}</h2>
            <p className="text-muted-foreground">{t("articles.subtitle")}</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/articles">
              {t("articles.viewAll")}
              <Arrow className="ms-2 h-4 w-4" />
            </Link>
          </Button>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {articles.map((article, i) => {
            const catLabel = articleCategories.find((c) => c.value === article.category);
            return (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link to={`/articles/${article.slug}`}>
                  <Card className="group h-full overflow-hidden border-0 shadow-sm transition-all hover:shadow-medical">
                    <div className="aspect-video overflow-hidden bg-muted">
                      <img
                        src={article.cover_image || "/placeholder.svg"}
                        alt={language === "ar" ? article.title_ar : article.title_en}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                    <CardContent className="p-5">
                      <span className="mb-2 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {catLabel
                          ? language === "ar" ? catLabel.label_ar : catLabel.label_en
                          : article.category}
                      </span>
                      <h3 className="mb-2 text-lg font-bold leading-snug">
                        {language === "ar" ? article.title_ar : article.title_en}
                      </h3>
                      <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                        {language === "ar" ? article.excerpt_ar : article.excerpt_en}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LatestArticlesSection;

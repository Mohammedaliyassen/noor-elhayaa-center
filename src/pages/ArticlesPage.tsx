import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import MainLayout from "@/components/layout/MainLayout";
import SEOHead from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useArticles } from "@/hooks/useArticles";
import { articleCategories } from "@/data/mockData";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const ArticlesPage = () => {
  const { t, language, isRTL } = useLanguage();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const { data: articles, isLoading } = useArticles();

  const filtered = useMemo(() => {
    if (!articles) return [];
    return articles.filter((a) => {
      const title = language === "ar" ? a.title_ar : a.title_en;
      const matchesSearch = title.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === "all" || a.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory, language, articles]);

  return (
    <MainLayout>
      <SEOHead
        title={t("articles.title")}
        description={isRTL
          ? "اقرأ أحدث المقالات الطبية في العلاج الطبيعي والتغذية العلاجية"
          : "Read the latest medical articles on physiotherapy and clinical nutrition"}
        slug="articles"
      />

      <section className="bg-gradient-hero py-16">
        <div className="container text-center">
          <h1 className="mb-3 text-3xl font-bold md:text-4xl">{t("articles.title")}</h1>
          <p className="text-muted-foreground">{t("articles.subtitle")}</p>
        </div>
      </section>

      <section className="py-12">
        <div className="container">
          {/* Search & Filter */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("articles.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={activeCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory("all")}
              >
                {t("articles.allCategories")}
              </Button>
              {articleCategories.map((cat) => (
                <Button
                  key={cat.value}
                  variant={activeCategory === cat.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(cat.value)}
                >
                  {language === "ar" ? cat.label_ar : cat.label_en}
                </Button>
              ))}
            </div>
          </div>

          {/* Articles Grid */}
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-video w-full" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((article, i) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
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
                          {articleCategories.find((c) => c.value === article.category)?.[language === "ar" ? "label_ar" : "label_en"] ?? article.category}
                        </span>
                        <h2 className="mb-2 text-lg font-bold leading-snug">
                          {language === "ar" ? article.title_ar : article.title_en}
                        </h2>
                        <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                          {language === "ar" ? article.excerpt_ar : article.excerpt_en}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className="py-16 text-center text-muted-foreground">
              {isRTL ? "لا توجد مقالات مطابقة" : "No matching articles found"}
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
};

export default ArticlesPage;

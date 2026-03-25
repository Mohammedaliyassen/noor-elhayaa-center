import { useParams, Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import MainLayout from "@/components/layout/MainLayout";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useArticleBySlug, useArticles } from "@/hooks/useArticles";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const ArticlePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, language, isRTL } = useLanguage();
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  const { data: article, isLoading } = useArticleBySlug(slug || "");
  const { data: allArticles } = useArticles();

  const related = allArticles?.filter((a) => a.id !== article?.id && a.category === article?.category).slice(0, 2) ?? [];

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container max-w-3xl py-12">
          <Skeleton className="mb-6 h-8 w-32" />
          <Skeleton className="mb-6 aspect-video w-full rounded-xl" />
          <Skeleton className="mb-4 h-10 w-3/4" />
          <Skeleton className="mb-8 h-4 w-1/2" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!article) {
    return (
      <MainLayout>
        <div className="container py-20 text-center">
          <h1 className="mb-4 text-2xl font-bold">{isRTL ? "المقال غير موجود" : "Article Not Found"}</h1>
          <Button asChild variant="outline">
            <Link to="/articles">{t("articles.back")}</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  const title = language === "ar" ? article.title_ar : article.title_en;
  const content = language === "ar" ? article.content_ar : article.content_en;
  const excerpt = language === "ar" ? article.excerpt_ar : article.excerpt_en;

  return (
    <MainLayout>
      <SEOHead title={title} description={excerpt} slug={`articles/${article.slug}`} type="article" />

      <article className="py-12">
        <div className="container max-w-3xl">
          <Button asChild variant="ghost" className="mb-6">
            <Link to="/articles">
              <BackArrow className="me-2 h-4 w-4" />
              {t("articles.back")}
            </Link>
          </Button>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-6 aspect-video overflow-hidden rounded-xl bg-muted">
              <img src={article.cover_image || "/placeholder.svg"} alt={title} className="h-full w-full object-cover" />
            </div>

            <h1 className="mb-4 text-3xl font-bold leading-tight md:text-4xl">{title}</h1>

            <div className="mb-8 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(article.created_at).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US")}
              </span>
            </div>

            <div className="prose prose-lg max-w-none whitespace-pre-line leading-relaxed text-foreground">
              {content}
            </div>
          </motion.div>

          {/* Related */}
          {related.length > 0 && (
            <div className="mt-12 border-t border-border pt-8">
              <h2 className="mb-6 text-xl font-bold">{t("articles.relatedArticles")}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {related.map((a) => (
                  <Link key={a.id} to={`/articles/${a.slug}`}>
                    <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-medical">
                      <div className="aspect-video overflow-hidden bg-muted">
                        <img
                          src={a.cover_image || "/placeholder.svg"}
                          alt={language === "ar" ? a.title_ar : a.title_en}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-bold">{language === "ar" ? a.title_ar : a.title_en}</h3>
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

export default ArticlePage;

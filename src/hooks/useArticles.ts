import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ArticleRow {
  id: string;
  title_ar: string;
  title_en: string;
  content_ar: string;
  content_en: string;
  excerpt_ar: string;
  excerpt_en: string;
  slug: string;
  cover_image: string | null;
  category: string;
  author_id: string;
  published: boolean;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export const useArticles = (options?: { publishedOnly?: boolean; limit?: number }) => {
  return useQuery({
    queryKey: ["articles", options],
    queryFn: async () => {
      let query = supabase
        .from("articles")
        .select("*")
        .order("created_at", { ascending: false });

      if (options?.publishedOnly !== false) {
        query = query.eq("published", true);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as ArticleRow[];
    },
  });
};

export const useArticleBySlug = (slug: string) => {
  return useQuery({
    queryKey: ["article", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (error) throw error;
      return data as ArticleRow | null;
    },
    enabled: !!slug,
  });
};


-- Add coupon_code and slug to offers
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS coupon_code text DEFAULT NULL;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS slug text DEFAULT NULL;

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS offers_slug_unique ON public.offers(slug) WHERE slug IS NOT NULL;

-- Create storage bucket for media
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true) ON CONFLICT DO NOTHING;

-- Storage policies for media bucket
CREATE POLICY "Public can view media" ON storage.objects FOR SELECT TO public USING (bucket_id = 'media');
CREATE POLICY "Authenticated can upload media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media');
CREATE POLICY "Authenticated can update media" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'media');
CREATE POLICY "Authenticated can delete media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'media');

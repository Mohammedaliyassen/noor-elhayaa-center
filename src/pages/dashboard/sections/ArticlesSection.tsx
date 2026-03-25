import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Pencil, Loader2, ImagePlus } from "lucide-react";
import { compressImage } from "@/lib/imageCompression";

interface Article {
  id: string;
  title_ar: string;
  title_en: string;
  excerpt_ar: string;
  excerpt_en: string;
  content_ar: string;
  content_en: string;
  slug: string;
  category: string;
  published: boolean;
  created_at: string;
  cover_image: string | null;
}

const defaultForm = {
  title_ar: "", title_en: "", excerpt_ar: "", excerpt_en: "",
  content_ar: "", content_en: "", slug: "", category: "physiotherapy", published: false,
};

const isBlobUrl = (value: string | null | undefined): value is string =>
  typeof value === "string" && value.startsWith("blob:");

const ArticlesSection = () => {
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fetchArticles = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("articles")
      .select("*")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false });
    setArticles((data as Article[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchArticles(); }, [user]);

  const resetForm = () => { setForm(defaultForm); setEditId(null); setImageFile(null); setImagePreview(null); };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setImageFile(compressed);
        setImagePreview(URL.createObjectURL(compressed));
      } catch {
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
      }
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) {
      return !isBlobUrl(imagePreview) ? imagePreview : null;
    }
    const path = `articles/${Date.now()}-${imageFile.name}`;
    const { error } = await supabase.storage.from("media").upload(path, imageFile);
    if (error) throw error;
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    if (!data.publicUrl || isBlobUrl(data.publicUrl)) {
      throw new Error("Failed to generate a valid public image URL");
    }
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const slug = form.slug || form.title_en.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || `article-${Date.now()}`;
      const coverImage = await uploadImage();
      if (isBlobUrl(coverImage)) {
        throw new Error("Local preview URLs cannot be saved");
      }

      const payload: any = { ...form, slug, author_id: user.id, cover_image: coverImage };

      if (editId) {
        await supabase.from("articles").update(payload).eq("id", editId);
        toast({ title: isRTL ? "تم التحديث" : "Updated" });
      } else {
        await supabase.from("articles").insert(payload);
        toast({ title: isRTL ? "تمت الإضافة" : "Added" });
      }

      setDialogOpen(false);
      resetForm();
      fetchArticles();
    } catch (error: any) {
      console.error(error);
      toast({
        title: isRTL ? "فشل رفع الصورة" : "Image upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (a: Article) => {
    setForm({
      title_ar: a.title_ar, title_en: a.title_en,
      excerpt_ar: a.excerpt_ar, excerpt_en: a.excerpt_en,
      content_ar: a.content_ar, content_en: a.content_en,
      slug: a.slug, category: a.category, published: a.published,
    });
    setEditId(a.id);
    setImagePreview(isBlobUrl(a.cover_image) ? null : a.cover_image);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("articles").delete().eq("id", id);
    toast({ title: isRTL ? "تم الحذف" : "Deleted" });
    fetchArticles();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{isRTL ? "المقالات" : "Articles"}</h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-medical"><Plus className="h-4 w-4 me-1" /> {isRTL ? "إضافة" : "Add"}</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editId ? (isRTL ? "تعديل مقال" : "Edit Article") : (isRTL ? "إضافة مقال" : "Add Article")}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label>{isRTL ? "العنوان (عربي)" : "Title (AR)"}</Label><Input value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} /></div>
              <div><Label>{isRTL ? "العنوان (إنجليزي)" : "Title (EN)"}</Label><Input value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} /></div>
              <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated" /></div>
              <div><Label>{isRTL ? "التصنيف" : "Category"}</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
              {/* Image upload */}
              <div className="sm:col-span-2">
                <Label>{isRTL ? "صورة الغلاف" : "Cover Image"}</Label>
                <div className="mt-1 flex items-center gap-3">
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-muted-foreground/30 px-4 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary">
                    <ImagePlus className="h-4 w-4" />
                    {isRTL ? "اختر صورة" : "Choose image"}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                  {imagePreview && <img src={imagePreview} alt="" className="h-12 w-12 rounded object-cover" />}
                </div>
              </div>
              <div className="sm:col-span-2"><Label>{isRTL ? "الملخص (عربي)" : "Excerpt (AR)"}</Label><Textarea value={form.excerpt_ar} onChange={(e) => setForm({ ...form, excerpt_ar: e.target.value })} rows={2} /></div>
              <div className="sm:col-span-2"><Label>{isRTL ? "الملخص (إنجليزي)" : "Excerpt (EN)"}</Label><Textarea value={form.excerpt_en} onChange={(e) => setForm({ ...form, excerpt_en: e.target.value })} rows={2} /></div>
              <div className="sm:col-span-2"><Label>{isRTL ? "المحتوى (عربي)" : "Content (AR)"}</Label><Textarea value={form.content_ar} onChange={(e) => setForm({ ...form, content_ar: e.target.value })} rows={5} /></div>
              <div className="sm:col-span-2"><Label>{isRTL ? "المحتوى (إنجليزي)" : "Content (EN)"}</Label><Textarea value={form.content_en} onChange={(e) => setForm({ ...form, content_en: e.target.value })} rows={5} /></div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} />
                <Label>{isRTL ? "منشور" : "Published"}</Label>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="mt-3 w-full bg-gradient-medical">
              {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {editId ? (isRTL ? "تحديث" : "Update") : (isRTL ? "حفظ" : "Save")}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : articles.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground">{isRTL ? "لا توجد مقالات" : "No articles yet"}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isRTL ? "العنوان" : "Title"}</TableHead>
                  <TableHead>{isRTL ? "التصنيف" : "Category"}</TableHead>
                  <TableHead>{isRTL ? "الحالة" : "Status"}</TableHead>
                  <TableHead>{isRTL ? "إجراءات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{isRTL ? a.title_ar : a.title_en}</TableCell>
                    <TableCell>{a.category}</TableCell>
                    <TableCell>
                      <Badge variant={a.published ? "default" : "secondary"}>
                        {a.published ? (isRTL ? "منشور" : "Published") : (isRTL ? "مسودة" : "Draft")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(a)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ArticlesSection;

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Loader2, Plus, Pencil, ImagePlus } from "lucide-react";
import { compressImage } from "@/lib/imageCompression";

interface Article {
  id: string;
  title_ar: string;
  title_en: string;
  content_ar: string;
  content_en: string;
  excerpt_ar: string;
  excerpt_en: string;
  slug: string;
  category: string;
  published: boolean;
  created_at: string;
  author_id: string;
  cover_image: string | null;
}

const defaultForm = {
  titleAr: "",
  titleEn: "",
  contentAr: "",
  contentEn: "",
  excerptAr: "",
  excerptEn: "",
  slug: "",
  category: "general",
};

const isBlobUrl = (value: string | null | undefined): value is string =>
  typeof value === "string" && value.startsWith("blob:");

const AdminArticlesSection = () => {
  const { isRTL } = useLanguage();
  const { user } = useAuth();
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
    setLoading(true);
    const { data } = await supabase
      .from("articles")
      .select("*")
      .order("created_at", { ascending: false });
    setArticles((data as Article[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const togglePublished = async (id: string, current: boolean) => {
    await supabase
      .from("articles")
      .update({ published: !current })
      .eq("id", id);
    toast({ title: isRTL ? "تم التحديث" : "Updated" });
    fetchArticles();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("articles").delete().eq("id", id);
    toast({ title: isRTL ? "تم الحذف" : "Deleted" });
    fetchArticles();
  };

  const resetForm = () => {
    setForm(defaultForm);
    setEditId(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleEdit = (a: Article) => {
    setForm({
      titleAr: a.title_ar,
      titleEn: a.title_en,
      contentAr: a.content_ar,
      contentEn: a.content_en,
      excerptAr: a.excerpt_ar,
      excerptEn: a.excerpt_en,
      slug: a.slug,
      category: a.category,
    });
    setEditId(a.id);
    setImagePreview(isBlobUrl(a.cover_image) ? null : a.cover_image);
    setDialogOpen(true);
  };

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
    const ext = imageFile.name.split(".").pop();
    const path = `articles/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("media")
      .upload(path, imageFile);
    if (error) throw error;
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    if (!data.publicUrl || isBlobUrl(data.publicUrl)) {
      throw new Error("Failed to generate a valid public image URL");
    }
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!user || !form.titleAr || !form.slug) {
      toast({
        title: isRTL
          ? "يرجى ملء الحقول المطلوبة"
          : "Please fill required fields",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const imageUrl = await uploadImage();
      if (isBlobUrl(imageUrl)) {
        throw new Error("Local preview URLs cannot be saved");
      }

      const payload: any = {
        title_ar: form.titleAr,
        title_en: form.titleEn,
        content_ar: form.contentAr,
        content_en: form.contentEn,
        excerpt_ar: form.excerptAr,
        excerpt_en: form.excerptEn,
        slug: form.slug,
        category: form.category,
        cover_image: imageUrl,
      };

      if (editId) {
        const { error } = await supabase
          .from("articles")
          .update(payload)
          .eq("id", editId);
        if (error) {
          toast({
            title: isRTL ? "خطأ" : "Error",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({ title: isRTL ? "تم التحديث" : "Updated" });
        }
      } else {
        payload.author_id = user.id;
        payload.published = true;
        const { error } = await supabase.from("articles").insert(payload);
        if (error) {
          toast({
            title: isRTL ? "خطأ" : "Error",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({ title: isRTL ? "تمت الإضافة" : "Article added" });
        }
      }

      resetForm();
      setDialogOpen(false);
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {isRTL ? "إدارة المقالات" : "Manage Articles"}
        </h2>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-gradient-medical">
              <Plus className="me-2 h-4 w-4" />
              {isRTL ? "إضافة مقال" : "Add Article"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editId
                  ? isRTL
                    ? "تعديل مقال"
                    : "Edit Article"
                  : isRTL
                    ? "مقال جديد"
                    : "New Article"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>
                  {isRTL ? "العنوان بالعربية *" : "Title (Arabic) *"}
                </Label>
                <Input
                  value={form.titleAr}
                  onChange={(e) =>
                    setForm({ ...form, titleAr: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>
                  {isRTL ? "العنوان بالإنجليزية" : "Title (English)"}
                </Label>
                <Input
                  value={form.titleEn}
                  onChange={(e) =>
                    setForm({ ...form, titleEn: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>{isRTL ? "الرابط (slug) *" : "Slug *"}</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="my-article"
                />
              </div>
              <div className="space-y-1">
                <Label>{isRTL ? "التصنيف" : "Category"}</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">
                      {isRTL ? "عام" : "General"}
                    </SelectItem>
                    <SelectItem value="physiotherapy">
                      {isRTL ? "علاج طبيعي" : "Physiotherapy"}
                    </SelectItem>
                    <SelectItem value="nutrition">
                      {isRTL ? "تغذية" : "Nutrition"}
                    </SelectItem>
                    <SelectItem value="health">
                      {isRTL ? "صحة" : "Health"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Image upload */}
              <div className="space-y-1">
                <Label>{isRTL ? "صورة الغلاف" : "Cover Image"}</Label>
                <div className="flex items-center gap-3">
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-muted-foreground/30 px-4 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary">
                    <ImagePlus className="h-4 w-4" />
                    {isRTL ? "اختر صورة" : "Choose image"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt=""
                      className="h-12 w-12 rounded object-cover"
                    />
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <Label>{isRTL ? "المقتطف بالعربية" : "Excerpt (Arabic)"}</Label>
                <Textarea
                  value={form.excerptAr}
                  onChange={(e) =>
                    setForm({ ...form, excerptAr: e.target.value })
                  }
                  rows={2}
                />
              </div>
              <div className="space-y-1">
                <Label>
                  {isRTL ? "المقتطف بالإنجليزية" : "Excerpt (English)"}
                </Label>
                <Textarea
                  value={form.excerptEn}
                  onChange={(e) =>
                    setForm({ ...form, excerptEn: e.target.value })
                  }
                  rows={2}
                />
              </div>
              <div className="space-y-1">
                <Label>{isRTL ? "المحتوى بالعربية" : "Content (Arabic)"}</Label>
                <Textarea
                  value={form.contentAr}
                  onChange={(e) =>
                    setForm({ ...form, contentAr: e.target.value })
                  }
                  rows={4}
                />
              </div>
              <div className="space-y-1">
                <Label>
                  {isRTL ? "المحتوى بالإنجليزية" : "Content (English)"}
                </Label>
                <Textarea
                  value={form.contentEn}
                  onChange={(e) =>
                    setForm({ ...form, contentEn: e.target.value })
                  }
                  rows={4}
                />
              </div>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-gradient-medical"
              >
                {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {editId
                  ? isRTL
                    ? "تحديث"
                    : "Update"
                  : isRTL
                    ? "إضافة"
                    : "Add"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : articles.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground">
              {isRTL ? "لا توجد مقالات" : "No articles"}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isRTL ? "العنوان" : "Title"}</TableHead>
                  <TableHead>{isRTL ? "التصنيف" : "Category"}</TableHead>
                  <TableHead>{isRTL ? "منشور" : "Published"}</TableHead>
                  <TableHead>{isRTL ? "التاريخ" : "Date"}</TableHead>
                  <TableHead>{isRTL ? "إجراءات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">
                      {isRTL ? a.title_ar : a.title_en}
                    </TableCell>
                    <TableCell>{a.category}</TableCell>
                    <TableCell>
                      <Switch
                        checked={a.published}
                        onCheckedChange={() =>
                          togglePublished(a.id, a.published)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(a.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(a)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(a.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
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

export default AdminArticlesSection;

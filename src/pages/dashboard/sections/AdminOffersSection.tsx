import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Loader2, Plus, Pencil, ImagePlus } from "lucide-react";
import { compressImage } from "@/lib/imageCompression";

interface Offer {
  id: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  discount_percentage: number | null;
  valid_until: string;
  active: boolean;
  created_at: string;
  doctor_id: string;
  image: string | null;
  coupon_code: string | null;
  slug: string | null;
}

const defaultForm = {
  titleAr: "", titleEn: "", descAr: "", descEn: "",
  discount: "", validUntil: "", couponCode: "", slug: "",
};

const isBlobUrl = (value: string | null | undefined): value is string =>
  typeof value === "string" && value.startsWith("blob:");

const AdminOffersSection = () => {
  const { isRTL } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fetchOffers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("offers")
      .select("*")
      .order("created_at", { ascending: false });
    setOffers((data as Offer[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchOffers(); }, []);

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("offers").update({ active: !current }).eq("id", id);
    toast({ title: isRTL ? "تم التحديث" : "Updated" });
    fetchOffers();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("offers").delete().eq("id", id);
    toast({ title: isRTL ? "تم الحذف" : "Deleted" });
    fetchOffers();
  };

  const resetForm = () => {
    setForm(defaultForm);
    setEditId(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleEdit = (o: Offer) => {
    setForm({
      titleAr: o.title_ar, titleEn: o.title_en,
      descAr: o.description_ar, descEn: o.description_en,
      discount: o.discount_percentage?.toString() ?? "",
      validUntil: o.valid_until,
      couponCode: o.coupon_code ?? "",
      slug: o.slug ?? "",
    });
    setEditId(o.id);
    setImagePreview(isBlobUrl(o.image) ? null : o.image);
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
    const path = `offers/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, imageFile);
    if (error) throw error;
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    if (!data.publicUrl || isBlobUrl(data.publicUrl)) {
      throw new Error("Failed to generate a valid public image URL");
    }
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!user || !form.titleAr || !form.validUntil) {
      toast({ title: isRTL ? "يرجى ملء الحقول المطلوبة" : "Please fill required fields", variant: "destructive" });
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
        description_ar: form.descAr,
        description_en: form.descEn,
        discount_percentage: form.discount ? parseInt(form.discount) : null,
        valid_until: form.validUntil,
        image: imageUrl,
        coupon_code: form.couponCode || null,
        slug: form.slug || null,
      };

      if (editId) {
        const { error } = await supabase.from("offers").update(payload).eq("id", editId);
        if (error) {
          toast({ title: isRTL ? "خطأ" : "Error", description: error.message, variant: "destructive" });
        } else {
          toast({ title: isRTL ? "تم التحديث" : "Updated" });
        }
      } else {
        payload.doctor_id = user.id;
        payload.active = true;
        const { error } = await supabase.from("offers").insert(payload);
        if (error) {
          toast({ title: isRTL ? "خطأ" : "Error", description: error.message, variant: "destructive" });
        } else {
          toast({ title: isRTL ? "تمت الإضافة" : "Offer added" });
        }
      }

      resetForm();
      setDialogOpen(false);
      fetchOffers();
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
        <h2 className="text-2xl font-bold">{isRTL ? "إدارة العروض" : "Manage Offers"}</h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-medical">
              <Plus className="me-2 h-4 w-4" />
              {isRTL ? "إضافة عرض" : "Add Offer"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editId ? (isRTL ? "تعديل عرض" : "Edit Offer") : (isRTL ? "عرض جديد" : "New Offer")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>{isRTL ? "العنوان بالعربية *" : "Title (Arabic) *"}</Label>
                <Input value={form.titleAr} onChange={(e) => setForm({ ...form, titleAr: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>{isRTL ? "العنوان بالإنجليزية" : "Title (English)"}</Label>
                <Input value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>{isRTL ? "الرابط (slug)" : "Slug"}</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="offer-name" />
              </div>
              <div className="space-y-1">
                <Label>{isRTL ? "الوصف بالعربية" : "Description (Arabic)"}</Label>
                <Textarea value={form.descAr} onChange={(e) => setForm({ ...form, descAr: e.target.value })} rows={3} />
              </div>
              <div className="space-y-1">
                <Label>{isRTL ? "الوصف بالإنجليزية" : "Description (English)"}</Label>
                <Textarea value={form.descEn} onChange={(e) => setForm({ ...form, descEn: e.target.value })} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>{isRTL ? "نسبة الخصم %" : "Discount %"}</Label>
                  <Input type="number" min="0" max="100" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>{isRTL ? "صالح حتى *" : "Valid Until *"}</Label>
                  <Input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>{isRTL ? "كود الكوبون" : "Coupon Code"}</Label>
                <Input value={form.couponCode} onChange={(e) => setForm({ ...form, couponCode: e.target.value })} placeholder="OFFER2024" />
              </div>
              {/* Image upload */}
              <div className="space-y-1">
                <Label>{isRTL ? "صورة العرض" : "Offer Image"}</Label>
                <div className="flex items-center gap-3">
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-muted-foreground/30 px-4 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary">
                    <ImagePlus className="h-4 w-4" />
                    {isRTL ? "اختر صورة" : "Choose image"}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                  {imagePreview && (
                    <img src={imagePreview} alt="" className="h-12 w-12 rounded object-cover" />
                  )}
                </div>
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full bg-gradient-medical">
                {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {editId ? (isRTL ? "تحديث" : "Update") : (isRTL ? "إضافة" : "Add")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : offers.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground">{isRTL ? "لا توجد عروض" : "No offers"}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isRTL ? "العنوان" : "Title"}</TableHead>
                  <TableHead>{isRTL ? "الخصم" : "Discount"}</TableHead>
                  <TableHead>{isRTL ? "الكوبون" : "Coupon"}</TableHead>
                  <TableHead>{isRTL ? "صالح حتى" : "Valid Until"}</TableHead>
                  <TableHead>{isRTL ? "نشط" : "Active"}</TableHead>
                  <TableHead>{isRTL ? "إجراءات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offers.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{isRTL ? o.title_ar : o.title_en}</TableCell>
                    <TableCell>{o.discount_percentage ? `${o.discount_percentage}%` : "—"}</TableCell>
                    <TableCell>{o.coupon_code || "—"}</TableCell>
                    <TableCell>{o.valid_until}</TableCell>
                    <TableCell>
                      <Switch checked={o.active} onCheckedChange={() => toggleActive(o.id, o.active)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(o)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(o.id)}>
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

export default AdminOffersSection;

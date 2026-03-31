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
  image: string | null;
  coupon_code: string | null;
  slug: string | null;
}

const defaultForm = {
  title_ar: "", title_en: "", description_ar: "", description_en: "",
  discount_percentage: "", valid_until: "", active: true,
  coupon_code: "", slug: "",
};

const isBlobUrl = (value: string | null | undefined): value is string =>
  typeof value === "string" && value.startsWith("blob:");

const OffersSection = () => {
  const { user } = useAuth();
  const { isRTL } = useLanguage();
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
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("offers")
      .select("*")
      .eq("doctor_id", user.id)
      .order("created_at", { ascending: false });
    setOffers((data as Offer[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchOffers(); }, [user]);

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
    const path = `offers/${Date.now()}-${imageFile.name}`;
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
      const imageUrl = await uploadImage();
      if (isBlobUrl(imageUrl)) {
        throw new Error("Local preview URLs cannot be saved");
      }

      const payload: any = {
        title_ar: form.title_ar,
        title_en: form.title_en,
        description_ar: form.description_ar,
        description_en: form.description_en,
        discount_percentage: form.discount_percentage ? parseInt(form.discount_percentage) : null,
        valid_until: form.valid_until,
        active: form.active,
        doctor_id: user.id,
        image: imageUrl,
        coupon_code: form.coupon_code || null,
        slug: form.slug || null,
      };

      if (editId) {
        await supabase.from("offers").update(payload).eq("id", editId);
        toast({ title: isRTL ? "تم التحديث" : "Updated" });
      } else {
        await supabase.from("offers").insert(payload);
        toast({ title: isRTL ? "تمت الإضافة" : "Added" });
      }

      setDialogOpen(false);
      resetForm();
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

  const handleEdit = (o: Offer) => {
    setForm({
      title_ar: o.title_ar, title_en: o.title_en,
      description_ar: o.description_ar, description_en: o.description_en,
      discount_percentage: o.discount_percentage?.toString() ?? "",
      valid_until: o.valid_until, active: o.active,
      coupon_code: o.coupon_code ?? "", slug: o.slug ?? "",
    });
    setEditId(o.id);
    setImagePreview(isBlobUrl(o.image) ? null : o.image);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("offers").delete().eq("id", id);
    toast({ title: isRTL ? "تم الحذف" : "Deleted" });
    fetchOffers();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{isRTL ? "العروض" : "Offers"}</h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-medical"><Plus className="h-4 w-4 me-1" /> {isRTL ? "إضافة" : "Add"}</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editId ? (isRTL ? "تعديل عرض" : "Edit Offer") : (isRTL ? "إضافة عرض" : "Add Offer")}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label>{isRTL ? "العنوان (عربي)" : "Title (AR)"}</Label><Input value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} /></div>
              <div><Label>{isRTL ? "العنوان (إنجليزي)" : "Title (EN)"}</Label><Input value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} /></div>
              <div><Label>{isRTL ? "الرابط (slug)" : "Slug"}</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="offer-name" /></div>
              <div><Label>{isRTL ? "كود الكوبون" : "Coupon Code"}</Label><Input value={form.coupon_code} onChange={(e) => setForm({ ...form, coupon_code: e.target.value })} placeholder="OFFER2024" /></div>
              <div className="sm:col-span-2"><Label>{isRTL ? "الوصف (عربي)" : "Description (AR)"}</Label><Textarea value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} rows={2} /></div>
              <div className="sm:col-span-2"><Label>{isRTL ? "الوصف (إنجليزي)" : "Description (EN)"}</Label><Textarea value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} rows={2} /></div>
              <div><Label>{isRTL ? "نسبة الخصم %" : "Discount %"}</Label><Input type="number" value={form.discount_percentage} onChange={(e) => setForm({ ...form, discount_percentage: e.target.value })} /></div>
              <div><Label>{isRTL ? "صالح حتى" : "Valid Until"}</Label><Input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} /></div>
              {/* Image upload */}
              <div className="sm:col-span-2">
                <Label>{isRTL ? "صورة العرض" : "Offer Image"}</Label>
                <div className="mt-1 flex items-center gap-3">
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-muted-foreground/30 px-4 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary">
                    <ImagePlus className="h-4 w-4" />
                    {isRTL ? "اختر صورة" : "Choose image"}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                  {imagePreview && <img src={imagePreview} alt="" className="h-12 w-12 rounded object-cover" />}
                </div>
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
                <Label>{isRTL ? "نشط" : "Active"}</Label>
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
          ) : offers.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground">{isRTL ? "لا توجد عروض" : "No offers yet"}</p>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden">
                {offers.map((o) => (
                  <div key={o.id} className="border-b p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold">{isRTL ? o.title_ar : o.title_en}</p>
                        {o.discount_percentage && <p className="text-sm font-semibold text-green-600">{o.discount_percentage}% OFF</p>}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {isRTL ? "صالح حتى:" : "Valid:"} {new Date(o.valid_until).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={o.active ? "default" : "secondary"}>
                        {o.active ? (isRTL ? "نشط" : "Active") : (isRTL ? "غير نشط" : "Inactive")}
                      </Badge>
                    </div>
                    <div className="mt-2 flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(o)}>
                        <Pencil className="me-1 h-4 w-4" />
                        {isRTL ? "تعديل" : "Edit"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(o.id)}>
                        <Trash2 className="me-1 h-4 w-4" />
                        {isRTL ? "حذف" : "Delete"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isRTL ? "العنوان" : "Title"}</TableHead>
                      <TableHead>{isRTL ? "الخصم" : "Discount"}</TableHead>
                      <TableHead>{isRTL ? "صالح حتى" : "Valid Until"}</TableHead>
                      <TableHead>{isRTL ? "الحالة" : "Status"}</TableHead>
                      <TableHead>{isRTL ? "إجراءات" : "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {offers.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-medium">{isRTL ? o.title_ar : o.title_en}</TableCell>
                        <TableCell>{o.discount_percentage ? `${o.discount_percentage}%` : "—"}</TableCell>
                        <TableCell>{new Date(o.valid_until).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={o.active ? "default" : "secondary"}>
                            {o.active ? (isRTL ? "نشط" : "Active") : (isRTL ? "غير نشط" : "Inactive")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(o)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(o.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OffersSection;

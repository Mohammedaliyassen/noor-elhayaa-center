import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import MainLayout from "@/components/layout/MainLayout";
import SEOHead from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Send, Info, Tag, CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const DAYS_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const DAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const BookingPage = () => {
  const { t, isRTL, language } = useLanguage();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const couponFromUrl = searchParams.get("coupon") || "";
  const discountFromUrl = searchParams.get("discount") || "";
  const [loading, setLoading] = useState(false);
  const [service, setService] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const { data: doctors } = useQuery({
    queryKey: ["doctors-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "doctor");
      if (error) throw error;
      if (!data?.length) return [];
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", data.map((d) => d.user_id));
      if (pErr) throw pErr;
      return profiles ?? [];
    },
  });

  const { data: availability } = useQuery({
    queryKey: ["doctor-availability", doctorId],
    queryFn: async () => {
      if (!doctorId) return [];
      const { data, error } = await supabase
        .from("doctor_availability")
        .select("*")
        .eq("doctor_id", doctorId)
        .eq("is_available", true)
        .order("day_of_week");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!doctorId,
  });

  const availableDayNumbers = (availability ?? []).map((a: any) => a.day_of_week);

  // Disable days that the doctor is NOT available on
  const disabledDays = (date: Date) => {
    if (date < new Date(new Date().setHours(0, 0, 0, 0))) return true; // past days
    if (availableDayNumbers.length === 0) return false; // no availability set = allow all
    return !availableDayNumbers.includes(date.getDay());
  };

  // Modifier for available days styling
  const availableModifier = (date: Date) => {
    if (date < new Date(new Date().setHours(0, 0, 0, 0))) return false;
    if (availableDayNumbers.length === 0) return false;
    return availableDayNumbers.includes(date.getDay());
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedDate) {
      toast({ title: isRTL ? "يرجى اختيار تاريخ" : "Please select a date", variant: "destructive" });
      return;
    }
    setLoading(true);

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const patientName = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const problem = formData.get("problem") as string;
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    try {
      const { error } = await supabase.from("appointments").insert({
        patient_name: patientName,
        phone,
        preferred_date: dateStr,
        problem_description: problem,
        service_type: service || "consultation",
        doctor_id: doctorId || null,
        user_id: user?.id || null,
      });

      if (error) throw error;

      if (user && doctorId) {
        const { data: existing } = await supabase
          .from("patients")
          .select("id")
          .eq("user_id", user.id)
          .eq("doctor_id", doctorId)
          .maybeSingle();

        if (!existing) {
          await supabase.from("patients").insert({
            user_id: user.id,
            doctor_id: doctorId,
            name: patientName,
            phone,
          });
        }
      }

      toast({ title: t("booking.success") });
      form.reset();
      setService("");
      setDoctorId("");
      setSelectedDate(undefined);
    } catch (err: any) {
      console.error("Booking error:", err);
      toast({ title: isRTL ? "حدث خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const dayNames = isRTL ? DAYS_AR : DAYS_EN;

  return (
    <MainLayout>
      <SEOHead
        title={t("booking.title")}
        description={isRTL ? "احجز موعدك مع مركز نور الحياة الطبي" : "Book your appointment with Noor Al-Hayat Medical Center"}
        slug="booking"
      />

      <section className="bg-gradient-hero py-16">
        <div className="container text-center">
          <h1 className="mb-3 text-3xl font-bold md:text-4xl">{t("booking.title")}</h1>
          <p className="text-muted-foreground">{t("booking.subtitle")}</p>
        </div>
      </section>

      <section className="py-12">
        <div className="container max-w-xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-0 shadow-medical">
              <CardHeader>
                <CardTitle>{t("booking.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                {couponFromUrl && (
                  <div className="mb-4 rounded-lg border border-secondary/30 bg-secondary/5 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-secondary">
                      <Tag className="h-4 w-4" />
                      {isRTL ? "كوبون خصم مُطبق" : "Discount Coupon Applied"}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">{couponFromUrl}</Badge>
                      {discountFromUrl && <span className="text-sm text-muted-foreground">{discountFromUrl}% {isRTL ? "خصم" : "Off"}</span>}
                    </div>
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t("booking.name")}</Label>
                    <Input id="name" name="name" required placeholder={isRTL ? "أدخل اسمك الكامل" : "Enter your full name"} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">{t("booking.phone")}</Label>
                    <Input id="phone" name="phone" type="tel" required placeholder="+20 1XX XXX XXXX" />
                  </div>

                  {doctors && doctors.length > 0 && (
                    <div className="space-y-2">
                      <Label>{isRTL ? "الطبيب المعالج" : "Treating Doctor"}</Label>
                      <Select value={doctorId} onValueChange={(v) => { setDoctorId(v); setSelectedDate(undefined); }}>
                        <SelectTrigger>
                          <SelectValue placeholder={isRTL ? "اختر الطبيب" : "Select doctor"} />
                        </SelectTrigger>
                        <SelectContent>
                          {doctors.map((doc) => (
                            <SelectItem key={doc.user_id} value={doc.user_id}>
                              {doc.display_name || (isRTL ? "طبيب" : "Doctor")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {doctorId && availability && availability.length > 0 && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
                        <Info className="h-4 w-4" />
                        {isRTL ? "أيام تواجد الطبيب" : "Doctor's available days"}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {availability.map((a: any) => (
                          <Badge key={a.day_of_week} variant="secondary" className="text-xs">
                            {dayNames[a.day_of_week]} ({a.start_time?.slice(0, 5)} - {a.end_time?.slice(0, 5)})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {doctorId && availability && availability.length === 0 && (
                    <div className="rounded-lg border border-muted bg-muted/50 p-3 text-sm text-muted-foreground">
                      {isRTL ? "لم يحدد الطبيب مواعيد تواجده بعد" : "Doctor hasn't set availability yet"}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="service">{t("booking.service")}</Label>
                    <Select value={service} onValueChange={setService} required>
                      <SelectTrigger>
                        <SelectValue placeholder={isRTL ? "اختر الخدمة" : "Select service"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="physiotherapy">{isRTL ? "العلاج الطبيعي" : "Physiotherapy"}</SelectItem>
                        <SelectItem value="nutrition">{isRTL ? "التغذية العلاجية" : "Clinical Nutrition"}</SelectItem>
                        <SelectItem value="consultation">{isRTL ? "استشارة طبية" : "Medical Consultation"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Calendar date picker with highlighted available days */}
                  <div className="space-y-2">
                    <Label>{t("booking.date")}</Label>
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-start font-normal",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="me-2 h-4 w-4" />
                          {selectedDate
                            ? format(selectedDate, "PPP", { locale: isRTL ? ar : undefined })
                            : (isRTL ? "اختر التاريخ" : "Pick a date")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => { setSelectedDate(date); setCalendarOpen(false); }}
                          disabled={disabledDays}
                          modifiers={{ available: availableModifier }}
                          modifiersClassNames={{ available: "bg-primary/20 text-primary font-semibold" }}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="problem">{t("booking.problem")}</Label>
                    <Textarea
                      id="problem"
                      name="problem"
                      required
                      rows={4}
                      placeholder={isRTL ? "اوصف مشكلتك الصحية..." : "Describe your health issue..."}
                    />
                  </div>

                  <Button type="submit" disabled={loading} className="w-full bg-gradient-medical hover:opacity-90">
                    <Send className="me-2 h-4 w-4" />
                    {loading ? (isRTL ? "جاري الإرسال..." : "Submitting...") : t("booking.submit")}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </MainLayout>
  );
};

export default BookingPage;
